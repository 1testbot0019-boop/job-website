import CategoryList from "../../components/CategoryList";

export const revalidate = 3600;

export default function NotificationPage() {
  return (
    <CategoryList
      category="NOTIFICATION"
      title="Notifications"
      blurb="General notices, circulars and corrigendums."
    />
  );
}
