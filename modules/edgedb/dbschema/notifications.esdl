
module notifications {
  scalar type NotificationType extending enum<
    NewIssueAssigned,
    DeadlineApproaching,
    ProjectUpdate,
    CommentAdded,
    DirectMessageReceived
  >;

  type Notification extending default::BaseObject, default::Auditable {
    required property type: NotificationType;
    required property read: bool {
      default := false;
    };
    required link sender -> default::User;
    required link receiver -> default::User;
    optional link issue -> issue::Issue;
    optional link comment -> issue::Comment;
    optional link message -> messaging::DirectMessage;

    # Access policy to allow users to mark notifications as read
    access policy user_can_mark_as_read
      allow update
      using (.receiver ?= global default::current_user);
  }
}
