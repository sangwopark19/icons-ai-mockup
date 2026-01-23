-- 기존 Generation 레코드 기본값 보정용 스크립트
UPDATE "generations"
SET "viewpoint_lock" = false,
    "white_background" = false
WHERE "viewpoint_lock" IS NULL
   OR "white_background" IS NULL;
