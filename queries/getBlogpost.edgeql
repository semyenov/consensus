select Issue {
  id,
  title,
  description,
  content
}
filter .id = <uuid>$Issue_id;
