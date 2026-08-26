import CategoryList from "../../components/CategoryList";

export const revalidate = 3600;

export default function ResultsPage() {
  return (
    <CategoryList
      category="RESULT"
      title="Results"
      blurb="Merit lists and selection results as published by the official commissions."
    />
  );
}
