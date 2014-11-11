# s3prefixed

S3 reading operations in prefixed buckets

## Motivation

For best possible performance during heavy PUT loads, we sometimes prefix our S3 keys. This makes reading from the bucket a little more challenging if you're looking for a specific file.

## Examples

```sh
$ s3prefixed ls s3://my-bucket/{prefix}/some/key/
$ s3prefixed cp s3://my-bucket/{prefix}/some/key/tile.vector.pbf
$ s3prefixed cp s3://my-bucket/{prefix}/some/key/tile.vector.pbf /somewhere/some.file

# Sorry but you can't copy into a prefixed bucket. This will fail:
$ s3prefixed cp /somewhere/some.file s3://my-bucket/{prefix}/some/key/tile.vector.pbf
Error: Must specify an s3 url
```
