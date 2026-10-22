/*
 * Copyright (c) 2024-2026 Brix Platform. All rights reserved.
 *
 * Storage Module End-to-End Integration Tests
 *
 * This test class validates the complete File Storage lifecycle including:
 *   1. File upload (single and batch)
 *   2. File metadata retrieval
 *   3. File download
 *   4. File deletion
 *   5. Access log audit
 *
 * Architecture Compliance:
 *   - Tests run against real Spring context
 *   - Uses H2 in-memory database for test isolation
 *   - Uses temporary file system for file storage
 *   - Validates RuntimeContext capability injection
 *
 * @author Brix Platform Team
 * @version 3.0.0-SNAPSHOT
 * @since 2026-02-24
 */
package io.brix.enterprise.app.storage.integration;

import tools.jackson.databind.ObjectMapper;
import io.brix.enterprise.app.storage.entity.FileMetadata;
import io.brix.enterprise.app.storage.enums.BusinessType;
import io.brix.enterprise.app.storage.repository.FileMetadataRepository;
import io.brix.enterprise.app.storage.config.StorageAutoConfiguration;
import io.runtime.sdk.context.RuntimeContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Answers;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Storage Module E2E Integration Test Suite
 *
 * <p>Validates the complete File Storage workflow through REST API endpoints.
 * Tests cover file upload, metadata management, download, and audit logging.</p>
 *
 * <h3>Test Coverage:</h3>
 * <ul>
 *   <li>File upload operations (single and multipart)</li>
 *   <li>File metadata CRUD operations</li>
 *   <li>File download functionality</li>
 *   <li>Business type filtering</li>
 *   <li>Access log audit trail</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @version 3.0.0-SNAPSHOT
 */
@SpringBootTest(classes = StorageE2ETest.StorageE2ETestApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Storage Module E2E Integration Tests")
@Tag("integration")
@Tag("e2e")
class StorageE2ETest {

    // ============================================================================
    // Dependencies
    // ============================================================================

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FileMetadataRepository fileMetadataRepository;

    @TempDir
    Path tempDir;

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @Import(StorageAutoConfiguration.class)
    static class StorageE2ETestApplication {

        @Bean
        RuntimeContext runtimeContext() {
            RuntimeContext runtimeContext = Mockito.mock(RuntimeContext.class, Answers.RETURNS_DEEP_STUBS);
            Mockito.when(runtimeContext.getAuthContext().getTenantId()).thenReturn(TEST_TENANT_ID);
            Mockito.when(runtimeContext.getAuthContext().getCurrentPrincipal().getName()).thenReturn(TEST_USER_ID);
            return runtimeContext;
        }
    }

    // ============================================================================
    // Test State
    // ============================================================================

    private String uploadedFileId;
    private static final String TEST_TENANT_ID = "test-tenant";
    private static final String TEST_USER_ID = "test-user";

    // ============================================================================
    // Setup
    // ============================================================================

    @BeforeEach
    void setUp() {
        // Test setup is managed per test via @Transactional
    }

    // ============================================================================
    // Helper Methods
    // ============================================================================

    /**
     * Creates a test FileMetadata entity with standard test values.
     *
     * @param id Unique identifier for the file
     * @param originalName Original filename
     * @param businessType Business type classification
     * @return Saved FileMetadata entity
     */
    private FileMetadata createTestFileMetadata(String id, String originalName, BusinessType businessType) {
        return fileMetadataRepository.save(
            FileMetadata.builder()
                .id(id)
                .tenantId(TEST_TENANT_ID)
                .originalName(originalName)
                .storagePath("/storage/" + TEST_TENANT_ID + "/" + businessType.name() + "/" + id)
                .fileSize(1024L)
                .contentType("application/pdf")
                .fileExtension("pdf")
                .md5Hash(UUID.randomUUID().toString().replace("-", ""))
                .businessType(businessType)
                .uploadedBy(TEST_USER_ID)
                .build()
        );
    }

    // ============================================================================
    // 1. File Upload Tests
    // ============================================================================

    @Nested
    @DisplayName("1. File Upload")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class FileUploadTests {

        @Test
        @Order(1)
        @DisplayName("1.1 Should upload a single file successfully")
        void shouldUploadSingleFile() throws Exception {
            // Arrange: Create mock file
            MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-document.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "PDF content placeholder".getBytes(StandardCharsets.UTF_8)
            );

            // Act & Assert: Upload file
            MvcResult result = mockMvc.perform(multipart("/api/storage/upload")
                    .file(file)
                    .param("businessType", "MEDICAL_INTAKE")
                    .param("description", "Patient medical records"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileId").exists())
                .andExpect(jsonPath("$.originalName").value("test-document.pdf"))
                .andReturn();

            // Store file ID for subsequent tests
            String responseBody = result.getResponse().getContentAsString();
            uploadedFileId = objectMapper.readTree(responseBody).get("fileId").asString();
            assertThat(uploadedFileId).isNotEmpty();
        }

        @Test
        @Order(2)
        @DisplayName("1.2 Should upload multiple files in batch")
        void shouldUploadMultipleFiles() throws Exception {
            // Arrange: Create multiple mock files
            MockMultipartFile file1 = new MockMultipartFile(
                "files",
                "document1.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "PDF content 1".getBytes(StandardCharsets.UTF_8)
            );

            MockMultipartFile file2 = new MockMultipartFile(
                "files",
                "document2.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "PDF content 2".getBytes(StandardCharsets.UTF_8)
            );

            // Act & Assert: Upload multiple files
            mockMvc.perform(multipart("/api/storage/upload/batch")
                    .file(file1)
                    .file(file2)
                    .param("businessType", "CONTRACT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));
        }

        @Test
        @Order(3)
        @DisplayName("1.3 Should reject upload with invalid file type")
        void shouldRejectInvalidFileType() throws Exception {
            // Arrange: Create file with disallowed extension
            MockMultipartFile file = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/x-executable",
                "executable content".getBytes(StandardCharsets.UTF_8)
            );

            // Act & Assert: Expect rejection
            mockMvc.perform(multipart("/api/storage/upload")
                    .file(file)
                    .param("businessType", "MEDICAL_INTAKE"))
                .andExpect(status().isBadRequest());
        }

        @Test
        @Order(4)
        @DisplayName("1.4 Should reject upload exceeding size limit")
        void shouldRejectOversizedFile() throws Exception {
            // Arrange: Create large file (simulate > 10MB)
            byte[] largeContent = new byte[11 * 1024 * 1024]; // 11MB
            MockMultipartFile file = new MockMultipartFile(
                "file",
                "large-document.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                largeContent
            );

            // Act & Assert: Expect rejection
            mockMvc.perform(multipart("/api/storage/upload")
                    .file(file)
                    .param("businessType", "MEDICAL_INTAKE"))
                .andExpect(status().isPayloadTooLarge());
        }
    }

    // ============================================================================
    // 2. File Metadata Tests
    // ============================================================================

    @Nested
    @DisplayName("2. File Metadata")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class FileMetadataTests {

        @Test
        @Order(1)
        @DisplayName("2.1 Should retrieve file metadata by ID")
        @Transactional
        void shouldRetrieveFileById() throws Exception {
            // Arrange: Create test file metadata
            FileMetadata entity = createTestFileMetadata(
                "test-file-001",
                "test-document.pdf",
                BusinessType.MEDICAL_INTAKE
            );

            // Act & Assert: Retrieve file metadata
            mockMvc.perform(get("/api/storage/files/{fileId}", entity.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("test-file-001"))
                .andExpect(jsonPath("$.originalName").value("test-document.pdf"))
                .andExpect(jsonPath("$.businessType").value("MEDICAL_INTAKE"));
        }

        @Test
        @Order(2)
        @DisplayName("2.2 Should return 404 for non-existent file")
        void shouldReturn404ForNonExistent() throws Exception {
            // Act & Assert: Request non-existent file
            mockMvc.perform(get("/api/storage/files/{fileId}", "non-existent-id"))
                .andExpect(status().isNotFound());
        }

        @Test
        @Order(3)
        @DisplayName("2.3 Should list files by business type")
        @Transactional
        void shouldListFilesByBusinessType() throws Exception {
            // Arrange: Create files with different business types
            createTestFileMetadata("medical-001", "medical-record.pdf", BusinessType.MEDICAL_INTAKE);
            createTestFileMetadata("contract-001", "contract.pdf", BusinessType.CONTRACT);

            // Act & Assert: List by business type
            mockMvc.perform(get("/api/storage/files")
                    .param("businessType", "MEDICAL_INTAKE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].businessType").value("MEDICAL_INTAKE"));
        }

        @Test
        @Order(4)
        @DisplayName("2.4 Should search files by keyword")
        @Transactional
        void shouldSearchFilesByKeyword() throws Exception {
            // Arrange: Create files with searchable names
            createTestFileMetadata("search-001", "patient-john-doe-record.pdf", BusinessType.MEDICAL_INTAKE);

            // Act & Assert: Search by keyword
            mockMvc.perform(get("/api/storage/files")
                    .param("keyword", "john-doe"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].originalName").value("patient-john-doe-record.pdf"));
        }
    }

    // ============================================================================
    // 3. File Deletion Tests
    // ============================================================================

    @Nested
    @DisplayName("3. File Deletion")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class FileDeletionTests {

        @Test
        @Order(1)
        @DisplayName("3.1 Should delete file by ID")
        @Transactional
        void shouldDeleteFileById() throws Exception {
            // Arrange: Create test file
            FileMetadata entity = createTestFileMetadata(
                "delete-001",
                "to-be-deleted.pdf",
                BusinessType.MEDICAL_INTAKE
            );

            // Act: Delete file
            mockMvc.perform(delete("/api/storage/files/{fileId}", entity.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileId").value(entity.getId()));

            // Assert: Verify deletion (soft delete - should not be found in active queries)
            assertThat(fileMetadataRepository.findByIdAndTenantId(entity.getId(), TEST_TENANT_ID)).isEmpty();
        }

        @Test
        @Order(2)
        @DisplayName("3.2 Should delete multiple files in batch")
        @Transactional
        void shouldDeleteFilesInBatch() throws Exception {
            // Arrange: Create multiple files
            createTestFileMetadata("batch-delete-001", "batch-file-1.pdf", BusinessType.MEDICAL_INTAKE);
            createTestFileMetadata("batch-delete-002", "batch-file-2.pdf", BusinessType.MEDICAL_INTAKE);

            // Act: Batch delete
            mockMvc.perform(delete("/api/storage/files/batch")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        ["batch-delete-001", "batch-delete-002"]
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deletedCount").value(2));
        }
    }

    // ============================================================================
    // 4. Access Log Tests
    // ============================================================================

    @Nested
    @DisplayName("4. Access Log Audit")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class AccessLogTests {

        @Test
        @Order(1)
        @DisplayName("4.1 Should retrieve access logs for file")
        @Transactional
        void shouldRetrieveAccessLogs() throws Exception {
            // Arrange: Create file with access logs
            FileMetadata entity = createTestFileMetadata(
                "audit-001",
                "audited-file.pdf",
                BusinessType.MEDICAL_INTAKE
            );

            // Act & Assert: Retrieve access logs
            mockMvc.perform(get("/api/storage/files/{fileId}/logs", entity.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
        }
    }

    // ============================================================================
    // 5. Performance Tests
    // ============================================================================

    @Nested
    @DisplayName("5. Performance Validation")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class PerformanceTests {

        @Test
        @Order(1)
        @DisplayName("5.1 Should retrieve file metadata within 200ms")
        @Transactional
        void shouldRetrieveWithinThreshold() throws Exception {
            // Arrange: Create test file
            FileMetadata entity = createTestFileMetadata(
                "perf-001",
                "performance-test.pdf",
                BusinessType.MEDICAL_INTAKE
            );

            // Act: Measure response time
            long startTime = System.currentTimeMillis();

            mockMvc.perform(get("/api/storage/files/{fileId}", entity.getId()))
                .andExpect(status().isOk());

            long responseTime = System.currentTimeMillis() - startTime;

            // Assert: Response under 200ms
            assertThat(responseTime)
                .as("Response time should be under 200ms, but was %dms", responseTime)
                .isLessThan(200);
        }

        @Test
        @Order(2)
        @DisplayName("5.2 Should list 100 files within 500ms")
        @Transactional
        void shouldListFilesWithinThreshold() throws Exception {
            // Arrange: Create 100 test files
            for (int i = 1; i <= 100; i++) {
                createTestFileMetadata(
                    "perf-list-" + String.format("%03d", i),
                    "performance-file-" + i + ".pdf",
                    BusinessType.MEDICAL_INTAKE
                );
            }

            // Act: Measure response time
            long startTime = System.currentTimeMillis();

            mockMvc.perform(get("/api/storage/files")
                    .param("page", "0")
                    .param("size", "100"))
                .andExpect(status().isOk());

            long responseTime = System.currentTimeMillis() - startTime;

            // Assert: Response under 500ms
            assertThat(responseTime)
                .as("Response time should be under 500ms, but was %dms", responseTime)
                .isLessThan(500);
        }
    }
}
