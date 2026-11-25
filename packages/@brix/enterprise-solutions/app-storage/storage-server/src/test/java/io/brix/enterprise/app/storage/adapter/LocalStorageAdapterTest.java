/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * This software is proprietary to Brix Platform and is protected by
 * copyright laws and international treaty provisions. Unauthorized
 * reproduction or distribution of this software, or any portion of it,
 * may result in severe civil and criminal penalties.
 *
 * Commercial use requires a valid Brix Enterprise license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
package io.brix.enterprise.app.storage.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;

import io.runtime.sdk.capability.ObservabilityCapability;
import io.runtime.sdk.context.RuntimeContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * The local adapter reports every I/O failure as an {@link UncheckedIOException} that keeps the cause, not as a generic
 * exception (standard-link plan queue item 21, 21e).
 */
class LocalStorageAdapterTest {

    @TempDir
    private Path directory;

    private final RuntimeContext context = mock(RuntimeContext.class);

    private LocalStorageAdapter adapter;

    @BeforeEach
    void openAdapter() {
        when(context.getObservability()).thenReturn(mock(ObservabilityCapability.class));
        adapter = new LocalStorageAdapter(context, directory.toString(), "http://localhost/files");
    }

    @Test
    @DisplayName("A stored file is read back, measured, copied and deleted")
    void storesAndReadsBack() throws IOException {
        upload("a/b.txt", "hello");

        try (InputStream file = adapter.download("a/b.txt")) {
            assertThat(file).hasBinaryContent("hello".getBytes(StandardCharsets.UTF_8));
        }
        assertThat(adapter.getFileSize("a/b.txt")).isEqualTo(5);
        adapter.copy("a/b.txt", "c/d.txt");
        adapter.delete("a/b.txt");
        assertThat(adapter.exists("a/b.txt")).isFalse();
        assertThat(adapter.exists("c/d.txt")).isTrue();
    }

    @Test
    @DisplayName("A base path that is a file stops the adapter with the I/O cause")
    void basePathThatIsAFile() throws IOException {
        Path file = Files.writeString(directory.resolve("file"), "x");

        assertIoFailure(() -> new LocalStorageAdapter(context, file.toString(), "http://localhost/files"));
    }

    @Test
    @DisplayName("An upload below a file fails with the I/O cause")
    void uploadBelowAFile() throws IOException {
        Files.writeString(directory.resolve("file"), "x");

        assertIoFailure(() -> upload("file/b.txt", "x"));
    }

    @Test
    @DisplayName("A download of a missing file fails with FileNotFoundException as the cause")
    void downloadOfAMissingFile() {
        assertThatThrownBy(() -> adapter.download("missing"))
            .isExactlyInstanceOf(UncheckedIOException.class).hasCauseInstanceOf(FileNotFoundException.class)
            .hasMessageContaining("missing");
    }

    @Test
    @DisplayName("A download of an unreadable file fails with the I/O cause")
    void downloadOfAnUnreadableFile() throws IOException {
        Path file = Files.writeString(directory.resolve("secret"), "x");
        Files.setPosixFilePermissions(file, PosixFilePermissions.fromString("---------"));

        assertIoFailure(() -> adapter.download("secret"));
    }

    @Test
    @DisplayName("Deleting a directory that is not empty fails with the I/O cause")
    void deleteOfANonEmptyDirectory() {
        upload("a/b.txt", "x");

        assertIoFailure(() -> adapter.delete("a"));
    }

    @Test
    @DisplayName("Copying or measuring a missing file fails with the I/O cause")
    void copyAndSizeOfAMissingFile() {
        assertIoFailure(() -> adapter.copy("missing", "target"));
        assertIoFailure(() -> adapter.getFileSize("missing"));
    }

    private void upload(String path, String content) {
        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
        adapter.upload(path, new ByteArrayInputStream(bytes), "text/plain", bytes.length);
    }

    private static void assertIoFailure(org.assertj.core.api.ThrowableAssert.ThrowingCallable call) {
        assertThatThrownBy(call).isExactlyInstanceOf(UncheckedIOException.class).hasCauseInstanceOf(IOException.class);
    }
}
