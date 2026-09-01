export const TEST_CATEGORIES = [
  { id: "gk", title: "General Knowledge", icon: "🧠", description: "Static GK for competitive exams" },
  { id: "reasoning", title: "Reasoning", icon: "🧩", description: "Logical reasoning and aptitude" },
  { id: "quant", title: "Quantitative Aptitude", icon: "🔢", description: "Arithmetic and numerical ability" },
  { id: "english", title: "English", icon: "📖", description: "Grammar, vocabulary and usage" },
  { id: "computer", title: "Computer", icon: "💻", description: "Computer awareness" },
  { id: "india", title: "Indian Polity & History", icon: "🇮🇳", description: "Useful for SSC, UPSC and Railways" },
  { id: "uttarakhand", title: "Uttarakhand GK", icon: "🏔️", description: "UKPSC, UKSSSC and state exam practice" },
  { id: "ssc", title: "SSC Practice", icon: "🎯", description: "Mixed SSC-style practice set" },
];

export const MCQS = [
  { id: 1, category: "gk", q: "What is the capital of India?", options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"], answer: 1, explanation: "New Delhi is the capital of India." },
  { id: 2, category: "gk", q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Mercury"], answer: 1, explanation: "Mars appears reddish because of iron oxides on its surface." },
  { id: 3, category: "gk", q: "Which is the largest ocean on Earth?", options: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"], answer: 2, explanation: "The Pacific Ocean is the largest ocean." },
  { id: 4, category: "gk", q: "Who wrote the national anthem of India?", options: ["Bankim Chandra Chattopadhyay", "Rabindranath Tagore", "Sarojini Naidu", "Subhas Chandra Bose"], answer: 1, explanation: "Rabindranath Tagore wrote Jana Gana Mana." },
  { id: 5, category: "gk", q: "How many states are there in India?", options: ["26", "28", "29", "30"], answer: 1, explanation: "India has 28 states and 8 Union Territories." },
  { id: 6, category: "reasoning", q: "Find the next number: 2, 4, 8, 16, ?", options: ["20", "24", "32", "36"], answer: 2, explanation: "Each number is multiplied by 2." },
  { id: 7, category: "reasoning", q: "If CAT is coded as DBU, how is DOG coded?", options: ["EPH", "EOG", "FPH", "DPG"], answer: 0, explanation: "Each letter is shifted one position forward." },
  { id: 8, category: "reasoning", q: "Which number is different from the others?", options: ["16", "25", "36", "48"], answer: 3, explanation: "16, 25 and 36 are perfect squares; 48 is not." },
  { id: 9, category: "reasoning", q: "A is taller than B and B is taller than C. Who is shortest?", options: ["A", "B", "C", "Cannot say"], answer: 2, explanation: "The order is A > B > C, so C is shortest." },
  { id: 10, category: "reasoning", q: "Complete the series: AZ, BY, CX, ?", options: ["DW", "DV", "EW", "DX"], answer: 0, explanation: "First letters move forward and second letters move backward." },
  { id: 11, category: "quant", q: "What is 15% of 200?", options: ["20", "25", "30", "35"], answer: 2, explanation: "200 × 15/100 = 30." },
  { id: 12, category: "quant", q: "If a train travels 120 km in 2 hours, its average speed is:", options: ["40 km/h", "50 km/h", "60 km/h", "80 km/h"], answer: 2, explanation: "Speed = distance/time = 120/2 = 60 km/h." },
  { id: 13, category: "quant", q: "The HCF of 18 and 24 is:", options: ["3", "6", "9", "12"], answer: 1, explanation: "6 is the greatest common factor of 18 and 24." },
  { id: 14, category: "quant", q: "What is the simple interest on ₹1,000 at 10% per annum for 2 years?", options: ["₹100", "₹150", "₹200", "₹250"], answer: 2, explanation: "SI = P×R×T/100 = ₹200." },
  { id: 15, category: "quant", q: "A number increased by 20% becomes 120. The original number is:", options: ["90", "100", "110", "115"], answer: 1, explanation: "120 ÷ 1.20 = 100." },
  { id: 16, category: "english", q: "Choose the synonym of 'Rapid'.", options: ["Slow", "Quick", "Weak", "Late"], answer: 1, explanation: "Rapid means quick or fast." },
  { id: 17, category: "english", q: "Choose the correctly spelled word.", options: ["Occassion", "Ocassion", "Occasion", "Occassian"], answer: 2, explanation: "The correct spelling is Occasion." },
  { id: 18, category: "english", q: "Fill in the blank: She ___ to school every day.", options: ["go", "goes", "going", "gone"], answer: 1, explanation: "With singular subject 'she', use 'goes'." },
  { id: 19, category: "english", q: "The antonym of 'Ancient' is:", options: ["Old", "Historic", "Modern", "Past"], answer: 2, explanation: "Modern is the opposite of ancient." },
  { id: 20, category: "english", q: "Identify the noun: 'Honesty is the best policy.'", options: ["best", "policy", "Honesty", "is"], answer: 2, explanation: "Honesty is a noun naming a quality." },
  { id: 21, category: "computer", q: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Control Processing User"], answer: 0, explanation: "CPU stands for Central Processing Unit." },
  { id: 22, category: "computer", q: "Which device is used to enter text into a computer?", options: ["Monitor", "Keyboard", "Speaker", "Projector"], answer: 1, explanation: "A keyboard is an input device." },
  { id: 23, category: "computer", q: "Which one is an operating system?", options: ["Windows", "Google", "HTML", "Wi-Fi"], answer: 0, explanation: "Windows is an operating system." },
  { id: 24, category: "computer", q: "1 byte is equal to how many bits?", options: ["4", "8", "16", "32"], answer: 1, explanation: "One byte contains 8 bits." },
  { id: 25, category: "computer", q: "What is the full form of URL?", options: ["Universal Record Link", "Uniform Resource Locator", "Unified Resource Line", "User Reference Link"], answer: 1, explanation: "URL means Uniform Resource Locator." },
  { id: 26, category: "india", q: "The Constitution of India came into effect on:", options: ["15 August 1947", "26 January 1950", "26 November 1949", "2 October 1950"], answer: 1, explanation: "The Constitution came into effect on 26 January 1950." },
  { id: 27, category: "india", q: "Who was the first President of India?", options: ["Jawaharlal Nehru", "Dr Rajendra Prasad", "Sardar Patel", "Dr S. Radhakrishnan"], answer: 1, explanation: "Dr Rajendra Prasad was India's first President." },
  { id: 28, category: "india", q: "Fundamental Rights are contained in which part of the Constitution?", options: ["Part I", "Part II", "Part III", "Part IV"], answer: 2, explanation: "Fundamental Rights are in Part III." },
  { id: 29, category: "india", q: "Who founded the Maurya Empire?", options: ["Ashoka", "Chandragupta Maurya", "Harsha", "Samudragupta"], answer: 1, explanation: "Chandragupta Maurya founded the Maurya Empire." },
  { id: 30, category: "india", q: "The Quit India Movement was launched in:", options: ["1930", "1935", "1942", "1947"], answer: 2, explanation: "The Quit India Movement was launched in 1942." },
  { id: 31, category: "uttarakhand", q: "What is the winter capital of Uttarakhand?", options: ["Haridwar", "Dehradun", "Nainital", "Almora"], answer: 1, explanation: "Dehradun is the winter capital; Gairsain is the summer capital." },
  { id: 32, category: "uttarakhand", q: "Which national park is famous for tigers in Uttarakhand?", options: ["Jim Corbett National Park", "Valmiki National Park", "Kanha National Park", "Ranthambore National Park"], answer: 0, explanation: "Jim Corbett National Park is in Uttarakhand." },
  { id: 33, category: "uttarakhand", q: "The state of Uttarakhand was formed in:", options: ["1998", "1999", "2000", "2001"], answer: 2, explanation: "Uttarakhand was formed on 9 November 2000." },
  { id: 34, category: "uttarakhand", q: "Which river is associated with Rishikesh?", options: ["Yamuna", "Ganga", "Narmada", "Godavari"], answer: 1, explanation: "Rishikesh is situated on the banks of the Ganga." },
  { id: 35, category: "uttarakhand", q: "Valley of Flowers National Park is in which district?", options: ["Chamoli", "Dehradun", "Haridwar", "Pithoragarh"], answer: 0, explanation: "Valley of Flowers National Park is in Chamoli district." },
  { id: 36, category: "ssc", q: "Which is the largest state of India by area?", options: ["Madhya Pradesh", "Maharashtra", "Rajasthan", "Uttar Pradesh"], answer: 2, explanation: "Rajasthan is the largest Indian state by area." },
  { id: 37, category: "ssc", q: "If 5 workers complete a job in 12 days, how many worker-days are required?", options: ["50", "60", "70", "72"], answer: 1, explanation: "5 × 12 = 60 worker-days." },
  { id: 38, category: "ssc", q: "Which gas is most abundant in Earth's atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], answer: 1, explanation: "Nitrogen makes up about 78% of Earth's atmosphere." },
  { id: 39, category: "ssc", q: "The minimum voting age in India is:", options: ["16", "18", "21", "25"], answer: 1, explanation: "The voting age in India is 18." },
  { id: 40, category: "ssc", q: "Which instrument measures atmospheric pressure?", options: ["Thermometer", "Barometer", "Hygrometer", "Ammeter"], answer: 1, explanation: "A barometer measures atmospheric pressure." },
];

export function getQuestions(category = "mixed", count = 10) {
  const pool = category === "mixed" ? MCQS : MCQS.filter((item) => item.category === category);
  const source = pool.length >= count ? pool : MCQS;
  return [...source].sort(() => Math.random() - 0.5).slice(0, count);
}

export function getCategory(id) {
  return TEST_CATEGORIES.find((item) => item.id === id);
}
