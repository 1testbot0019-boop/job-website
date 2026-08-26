import CategoryList from "../../components/CategoryList";

export const revalidate = 3600;

export default function SyllabusPage() {
  return (
    <CategoryList
      category="SYLLABUS"
      title="Syllabus"
      blurb="Exam syllabus and pattern documents."
    />
  );
}
