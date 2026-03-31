import * as ftp from 'basic-ftp';
import { Readable } from 'stream';

function getFtpConfig() {
  const host = process.env.FTP_HOST;
  const user = process.env.FTP_USER;
  const password = process.env.FTP_PASSWORD;
  const port = parseInt(process.env.FTP_PORT || '21', 10);
  const rootPath = process.env.FTP_ROOT_PATH || '';
  const publicUrl = process.env.FTP_PUBLIC_URL || '';

  if (!host || !user || !password) {
    throw new Error('[FTP] Missing configuration: FTP_HOST, FTP_USER, FTP_PASSWORD are required.');
  }

  return { host, user, password, port, rootPath, publicUrl };
}

/**
 * Uploads a file buffer to the FTP server.
 * @param fileBuffer - The file contents as a Buffer.
 * @param fileName   - The destination filename (e.g. "abc123.jpg").
 * @param subDir     - Optional subdirectory relative to FTP_ROOT_PATH (e.g. "proforma-items/uuid").
 * @returns          - The public URL of the uploaded file.
 */
export async function uploadToFtp(fileBuffer: Buffer, fileName: string, subDir?: string): Promise<string> {
  const config = getFtpConfig();
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
      secure: false,
    });

    // Navigate to root path
    if (config.rootPath && config.rootPath !== '/') {
      await client.cd(config.rootPath);
    }

    // Navigate into (and create if needed) the subdirectory
    if (subDir) {
      await client.ensureDir(subDir);
    }

    // Upload the file
    const readableStream = Readable.from(fileBuffer);
    await client.uploadFrom(readableStream, fileName);

    // Build public URL including the subDir if present
    const basePart = subDir
      ? `${subDir.replace(/\/$/, '')}/${fileName}`
      : fileName;

    const publicUrl = config.publicUrl
      ? `${config.publicUrl.replace(/\/$/, '')}/${basePart}`
      : basePart;

    return publicUrl;

  } catch (err: any) {
    console.error(`[FTP] ERROR: ${err.message}`);
    throw err;
  } finally {
    client.close();
  }
}

/**
 * Deletes a file from the FTP server.
 * @param fileName  - The filename to delete.
 * @param subDir    - Optional subdirectory relative to FTP_ROOT_PATH.
 */
export async function deleteFromFtp(fileName: string, subDir?: string): Promise<void> {
  const config = getFtpConfig();
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
      secure: false,
    });

    // Navigate to root path
    if (config.rootPath && config.rootPath !== '/') {
      await client.cd(config.rootPath);
    }

    const pathToDelete = subDir ? `${subDir}/${fileName}` : fileName;
    await client.remove(pathToDelete);

  } catch (err: any) {
    console.error(`[FTP] DELETE ERROR: ${err.message}`);
    // We don't necessarily want to throw if the file is already gone
  } finally {
    client.close();
  }
}
