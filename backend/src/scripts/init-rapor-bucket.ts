import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

/**
 * Script to initialize rapor bucket in MinIO/S3
 * Run with: npx ts-node src/scripts/init-rapor-bucket.ts
 */
async function initRaporBucket() {
  const configService = new ConfigService();

  const endpoint = configService.get<string>('S3_ENDPOINT', 'localhost');
  const port = configService.get<number>('S3_PORT', 9000);
  const useSSL = configService.get<string>('S3_USE_SSL', 'false') === 'true';
  const accessKey = configService.get<string>('S3_ACCESS_KEY', '');
  const secretKey = configService.get<string>('S3_SECRET_KEY', '');
  const bucketName = 'rapor';

  console.log('🔧 Initializing MinIO/S3 client...');
  console.log(`   Endpoint: ${endpoint}:${port}`);
  console.log(`   Use SSL: ${useSSL}`);
  console.log(`   Bucket: ${bucketName}`);

  const minioClient = new Minio.Client({
    endPoint: endpoint,
    port: port,
    useSSL: useSSL,
    accessKey: accessKey,
    secretKey: secretKey,
  });

  try {
    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName);

    if (bucketExists) {
      console.log(`✅ Bucket '${bucketName}' already exists`);
    } else {
      // Create bucket
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ Bucket '${bucketName}' created successfully`);
    }

    // Set bucket policy to allow public read (optional, for debugging)
    // Uncomment if you want public access for testing
    /*
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    console.log(`✅ Bucket policy set for '${bucketName}'`);
    */

    console.log('\n✨ Rapor bucket initialization completed successfully!');
  } catch (error) {
    console.error('❌ Error initializing rapor bucket:', error);
    process.exit(1);
  }
}

// Run the script
initRaporBucket();
