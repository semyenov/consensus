
module messaging {
  type DirectMessage extending default::BaseObject, default::Auditable {
    required property content: str;
    required link sender -> default::User;
    required link receiver -> default::User;
    required link conversation -> messaging::Conversation;

    # Access policy to allow users to send messages
    access policy user_can_send_messages
      allow insert
      using (.sender ?= global default::current_user);
  }

  type Conversation extending default::BaseObject, default::Auditable {
    required link participants -> default::User;
    required property last_message_time: datetime;

    multi link messages := .<conversation[is messaging::DirectMessage];

    # Computed property to get the latest message
    property latest_message := max(.messages.created_at);

    # Access policy to allow users to view conversations
    access policy user_can_view_conversations
      allow select
      using (.participants ?= global default::current_user);
  }
}
