-- Uploads can now live on Cloudinary, whose URLs exceed the 100-character
-- path column Django created.
ALTER TABLE "store_product" ALTER COLUMN "image" TYPE VARCHAR(255);
