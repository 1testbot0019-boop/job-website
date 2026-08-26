import CategoryList from "../../components/CategoryList";

export const revalidate = 3600;

export default function JobsPage() {
  return (
    <CategoryList
      category="JOB"
      title="Latest Jobs"
      blurb="Recruitment notices and vacancy advertisements from Uttarakhand government departments."
    />
  );
}
