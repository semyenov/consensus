select Blogpost {
  id,
  title,
  description,
  content
}
filter .id = <uuid>$blogpost_id;
