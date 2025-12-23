from __future__ import annotations

import os
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO, Optional


@dataclass
class StoredObject:
    key: str
    url: str


class ObjectStore:
    def put(self, *, fileobj: BinaryIO, filename: str, content_type: str) -> StoredObject:
        raise NotImplementedError


class LocalObjectStore(ObjectStore):
    def __init__(self, base_dir: str) -> None:
        self.base = Path(base_dir).resolve()
        self.base.mkdir(parents=True, exist_ok=True)

    def put(self, *, fileobj: BinaryIO, filename: str, content_type: str) -> StoredObject:
        _ = content_type
        ext = ""
        if "." in filename:
            ext = "." + filename.split(".")[-1].lower()
        key = f"uploads/{uuid.uuid4()}{ext}"
        path = self.base / key
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            f.write(fileobj.read())
        return StoredObject(key=key, url=str(path))


class S3ObjectStore(ObjectStore):
    def __init__(
        self,
        *,
        endpoint_url: str,
        bucket: str,
        access_key: str,
        secret_key: str,
        region: str = "us-east-1",
        public_base_url: Optional[str] = None,
    ) -> None:
        import boto3

        self.bucket = bucket
        self.public_base_url = public_base_url
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )

    def put(self, *, fileobj: BinaryIO, filename: str, content_type: str) -> StoredObject:
        ext = ""
        if "." in filename:
            ext = "." + filename.split(".")[-1].lower()
        key = f"uploads/{uuid.uuid4()}{ext}"
        self.client.upload_fileobj(
            Fileobj=fileobj,
            Bucket=self.bucket,
            Key=key,
            ExtraArgs={"ContentType": content_type or "application/octet-stream"},
        )
        if self.public_base_url:
            url = f"{self.public_base_url.rstrip('/')}/{key}"
        else:
            url = f"s3://{self.bucket}/{key}"
        return StoredObject(key=key, url=url)


def get_store() -> ObjectStore:
    endpoint = os.getenv("S3_ENDPOINT", "").strip()
    bucket = os.getenv("S3_BUCKET", "").strip()
    access = os.getenv("S3_ACCESS_KEY", "").strip()
    secret = os.getenv("S3_SECRET_KEY", "").strip()
    region = os.getenv("S3_REGION", "us-east-1").strip() or "us-east-1"
    public_base = os.getenv("S3_PUBLIC_BASE_URL", "").strip() or None

    if endpoint and bucket and access and secret:
        return S3ObjectStore(
            endpoint_url=endpoint,
            bucket=bucket,
            access_key=access,
            secret_key=secret,
            region=region,
            public_base_url=public_base,
        )

    base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data"))
    return LocalObjectStore(os.path.join(base, "uploads"))
