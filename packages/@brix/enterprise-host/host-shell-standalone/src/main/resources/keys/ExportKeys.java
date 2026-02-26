import java.io.*;
import java.security.*;
import java.util.Base64;
public class ExportKeys {
    public static void main(String[] args) throws Exception {
        String ksPath = args[0];
        String outDir = args[1];
        KeyStore ks = KeyStore.getInstance("PKCS12");
        ks.load(new FileInputStream(ksPath), "changeit".toCharArray());
        java.security.cert.Certificate cert = ks.getCertificate("shinwa-jwt");
        PublicKey pub = cert.getPublicKey();
        String pubPem = "-----BEGIN PUBLIC KEY-----\n" + Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(pub.getEncoded()) + "\n-----END PUBLIC KEY-----\n";
        new FileOutputStream(outDir + "\\public.pem").write(pubPem.getBytes());
        PrivateKey priv = (PrivateKey) ks.getKey("shinwa-jwt", "changeit".toCharArray());
        String privPem = "-----BEGIN PRIVATE KEY-----\n" + Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(priv.getEncoded()) + "\n-----END PRIVATE KEY-----\n";
        new FileOutputStream(outDir + "\\private.pem").write(privPem.getBytes());
        System.out.println("Keys exported successfully!");
    }
}