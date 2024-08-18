module default {
  abstract type BaseObject extending std::Object {
    required name: str;
    required description: str;

    index on (.name);
  }

  abstract type Auditable {
    required created_at: datetime {
      default := datetime_current();
    }
    required updated_at: datetime {
      default := datetime_current();
    }
  }
}
