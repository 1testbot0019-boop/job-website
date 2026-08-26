import CategoryList from "../../components/CategoryList";

export const revalidate = 3600;

export default function AnswerKeyPage() {
  return (
    <CategoryList
      category="ANSWER_KEY"
      title="Answer Keys"
      blurb="Provisional and final answer keys released after an exam."
    />
  );
}
