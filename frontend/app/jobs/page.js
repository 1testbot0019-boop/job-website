import CategoryList from "../../components/CategoryList";

export const revalidate = 3600;

const STATES = [
  "Andaman and Nicobar",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export default async function JobsPage({ searchParams }) {
  const params = await searchParams;
  const requestedState = params?.state;
  const state = STATES.includes(requestedState) ? requestedState : null;

  return (
    <CategoryList
      category="JOB"
      title={state ? `${state} Government Jobs` : "Latest Government Jobs in India"}
      blurb={
        state
          ? `Latest recruitment notices and vacancy advertisements for ${state}.`
          : "Browse the latest government jobs across India. Select a State or Union Territory to see only jobs from that location."
      }
      state={state}
      stateOptions={STATES}
    />
  );
}
