import sys
import types
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


try:
    import pymilvus  # noqa: F401
except ModuleNotFoundError:
    fake_pymilvus = types.ModuleType("pymilvus")
    fake_pymilvus.CollectionSchema = object
    fake_pymilvus.DataType = types.SimpleNamespace(
        INT64="INT64",
        FLOAT_VECTOR="FLOAT_VECTOR",
        VARCHAR="VARCHAR",
    )
    fake_pymilvus.FieldSchema = object
    fake_pymilvus.MilvusClient = object
    sys.modules.setdefault("pymilvus", fake_pymilvus)

    fake_pymilvus_exceptions = types.ModuleType("pymilvus.exceptions")
    fake_pymilvus_exceptions.MilvusException = Exception
    sys.modules.setdefault("pymilvus.exceptions", fake_pymilvus_exceptions)

    fake_pymilvus_client = types.ModuleType("pymilvus.milvus_client")
    fake_pymilvus_client.IndexParams = object
    sys.modules.setdefault("pymilvus.milvus_client", fake_pymilvus_client)
