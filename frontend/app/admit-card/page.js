import CategoryList from "../../components/CategoryList";

export const revalidate = 3600;

export default function AdmitCardPage() {
  return (
    <CategoryList
      category="ADMIT_CARD"
      title="Admit Cards"
      blurb="Call letters and admit cards for upcoming exams."
    />
  );
}
