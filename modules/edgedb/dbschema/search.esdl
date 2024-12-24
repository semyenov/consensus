module search {
  scalar type EmbeddingVector extending ext::pgvector::vector<1536>;

  abstract type VectorSearchable {
    required embedding: EmbeddingVector;
    index ext::pgvector::ivfflat_cosine(lists := 100)
      on (.embedding);
  }

  function vector_search(
    search_vector: EmbeddingVector,
    search_limit: int64
  ) -> set of (
    tuple<
      item: search::VectorSearchable,
      similarity: float64
    >
  ) {
    using (
      with
        matches := (
          select search::VectorSearchable {
            similarity := ext::pgvector::cosine_distance(.embedding, search_vector)
          }
          order by .similarity
          limit search_limit
        )
      select (
        item := matches,
        similarity := matches.similarity
      )
    )
  }
}
