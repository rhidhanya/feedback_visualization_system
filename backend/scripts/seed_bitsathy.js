/**
 * seed_bitsathy.js
 * ─────────────────────────────────────────────────────────────────
 * Seeds exactly:
 *  - 300 students  → name@bitsathy.in, password: student123
 *  - 100 faculties → name@bitsathy.in, password: faculty123
 *  - 2 mess incharges   → name@bitsathy.in, password: mess123
 *  - 1 transport incharge → name@bitsathy.in, password: transport123
 *  - 3 hostel incharges → name@bitsathy.in, password: hostel123
 *  - 2 sanitation incharges → name@bitsathy.in, password: sanitation123
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Department = require('../models/Department');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Domain = require('../models/Domain');
const Feedback = require('../models/Feedback');
const DomainFeedback = require('../models/DomainFeedback');

const ACADEMIC_YEAR = '2025-26';

// ── Name pools ────────────────────────────────────────────────────
const STUDENT_NAMES = [
    'Aarav Sharma', 'Aditi Nair', 'Aditya Kumar', 'Akash Pillai', 'Ananya Krishnan',
    'Arun Menon', 'Arjun Rao', 'Aswini Iyer', 'Bhavana Subramaniam', 'Chandrika Reddy',
    'Deepa Patel', 'Deepika Varma', 'Divya Singh', 'Ganesh Verma', 'Geethu Das',
    'Govind Rajan', 'Hari Anandan', 'Harini Srinivasan', 'Harish Balaji', 'Ishaan Kannan',
    'Janani Selvam', 'Karthik Murugan', 'Kavitha Chandra', 'Keerthi Babu', 'Krishnan Devi',
    'Lakshmi Mehta', 'Lavanya Mishra', 'Manoj Pandey', 'Meena Ghosh', 'Megha Roy',
    'Mohan Nair', 'Nisha Pillai', 'Nithya Rao', 'Padma Sharma', 'Pooja Kumar',
    'Pradeep Menon', 'Priya Iyer', 'Rahul Subramaniam', 'Rajan Reddy', 'Ramesh Patel',
    'Ranjith Varma', 'Rekha Singh', 'Rohit Verma', 'Saravanan Das', 'Saranya Rajan',
    'Shruthi Anandan', 'Sindhu Srinivasan', 'Sneha Balaji', 'Sriram Kannan', 'Suresh Selvam',
    'Swathi Murugan', 'Tarun Chandra', 'Thamizh Babu', 'Uma Devi', 'Varsha Mehta',
    'Vidhya Mishra', 'Vijay Pandey', 'Vimal Ghosh', 'Vinod Roy', 'Vishnu Nair',
    'Aakash Pillai', 'Abirami Rao', 'Abinaya Sharma', 'Abishek Kumar', 'Abitha Menon',
    'Ajay Iyer', 'Ajith Subramaniam', 'Akila Reddy', 'Amala Patel', 'Amaran Varma',
    'Amitha Singh', 'Amritha Verma', 'Anand Das', 'Ananthi Rajan', 'Anbu Anandan',
    'Anita Srinivasan', 'Anjali Balaji', 'Annamalai Kannan', 'Annette Selvam', 'Anthony Murugan',
    'Anushiya Chandra', 'Aravindan Babu', 'Arockia Devi', 'Arthika Mehta', 'Arulmani Mishra',
    'Arulselvi Pandey', 'Arunkumar Ghosh', 'Ashwin Roy', 'Asokan Nair', 'Aswin Pillai',
    'Balamurugan Rao', 'Balasaraswathi Sharma', 'Balasundaram Kumar', 'Barath Menon', 'Barathi Iyer',
    'Bharat Subramaniam', 'Bharathi Reddy', 'Bharathwaj Patel', 'Bhuvaneshwari Varma', 'Boopathi Singh',
    'Brindha Verma', 'Chandra Das', 'Chandrakala Rajan', 'Chandrasekar Anandan', 'Charanya Srinivasan',
    'Chithra Balaji', 'Chockalingam Kannan', 'Dahlia Selvam', 'Dakshin Murugan', 'Deivasigamani Chandra',
    'Dhanalakshmi Babu', 'Dhanesh Devi', 'Dhivya Mehta', 'Dhruv Mishra', 'Dinesh Pandey',
    'Durga Ghosh', 'Ebenezer Roy', 'Elamathi Nair', 'Elavarasan Pillai', 'Elbi Rao',
    'Eliza Sharma', 'Emmanuel Kumar', 'Ezhilarasan Menon', 'Ezhilmathi Iyer', 'Fathima Subramaniam',
    'Flavia Reddy', 'Ganeshkumar Patel', 'Gayathiri Varma', 'Gayathri Singh', 'George Verma',
    'Gokulraj Das', 'Gopalakrishnan Rajan', 'Gopika Anandan', 'Guru Srinivasan', 'Gurunathan Balaji',
    'Hariharasudan Kannan', 'Hemalatha Selvam', 'Hemavathi Murugan', 'Indhumathi Chandra', 'Indira Babu',
    'Indu Devi', 'Infanta Mehta', 'Iniyan Mishra', 'Irene Pandey', 'Iswarya Ghosh',
    'Jacqueline Roy', 'Jagan Nair', 'Jagannathan Pillai', 'Jaikumar Rao', 'Jaisankar Sharma',
    'Jaya Kumar', 'Jayalakshmi Menon', 'Jayanthan Iyer', 'Jayapriya Subramaniam', 'Jayashree Reddy',
    'Jennifer Patel', 'Jeslin Varma', 'Johnson Singh', 'Joseph Verma', 'Jothi Das',
    'Kabilan Rajan', 'Kalaichelvi Anandan', 'Kalaiyarasan Srinivasan', 'Kalimuthu Balaji', 'Kalpana Kannan',
    'Kanimozhi Selvam', 'Kannan Murugan', 'Karunakaran Chandra', 'Kavipriya Babu', 'Kaviyarasan Devi',
    'Keerthana Mehta', 'Kiruba Mishra', 'Kirubakaran Pandey', 'Kirubha Ghosh', 'Kokila Roy',
    'Kousalya Nair', 'Krishnamohan Pillai', 'Krishnaveni Rao', 'Kumaresan Sharma', 'Kumaravel Kumar',
    'Lalitha Menon', 'Lawrence Iyer', 'Leela Subramaniam', 'Lekha Reddy', 'Lena Patel',
    'Lincy Varma', 'Logesh Singh', 'Logeshwaran Verma', 'Logeswari Das', 'Lokesh Rajan',
    'Mageswaran Anandan', 'Mahesh Srinivasan', 'Malarvizhi Balaji', 'Malathi Kannan', 'Malarselvi Selvam',
    'Manikandan Murugan', 'Manjula Chandra', 'Manojkumar Babu', 'Mathan Devi', 'Mathavan Mehta',
    'Mathivanan Mishra', 'Maya Pandey', 'Michael Ghosh', 'Miriam Roy', 'Mohanraj Nair',
    'Mohankumar Pillai', 'Mubarak Rao', 'Muralitharan Sharma', 'Murugesh Kumar', 'Muthu Menon',
    'Muthukumaran Iyer', 'Muthulakshmi Subramaniam', 'Muthupandi Reddy', 'Mythili Patel', 'Nagalakshmi Varma',
    'Nagaraj Singh', 'Nagarajan Verma', 'Nagendran Das', 'Nandhakumar Rajan', 'Nandha Anandan',
    'Nandini Srinivasan', 'Nandhini Balaji', 'Naveen Kannan', 'Naveenkumar Selvam', 'Naveetha Murugan',
    'Neethu Chandra', 'Nithyakalyani Babu', 'Nivi Devi', 'Oviya Mehta', 'Palanisamy Mishra',
    'Pallavi Pandey', 'Pandiyarajan Ghosh', 'Paramasivam Roy', 'Parkavi Nair', 'Parvathi Pillai',
    'Ponselvam Rao', 'Ponmalar Sharma', 'Ponmani Kumar', 'Ponraja Menon', 'Ponselvi Iyer',
    'Prabakaran Subramaniam', 'Prabha Reddy', 'Prabhakaran Patel', 'Prabhu Varma', 'Prakash Singh',
    'Pratheeksha Verma', 'Praveen Das', 'Praveena Rajan', 'Preethi Anandan', 'Prema Srinivasan',
    'Premkumar Balaji', 'Priyadharshini Kannan', 'Priyanka Selvam', 'Raja Murugan', 'Rajasekar Chandra',
    'Rajeshkumar Babu', 'Rajkumar Devi', 'Ram Mehta', 'Ramachandran Mishra', 'Ramamoorthy Pandey',
    'Ramiya Ghosh', 'Ramkumar Roy', 'Ramya Nair', 'Ranjitha Pillai', 'Rebecca Rao',
    'Revathi Sharma', 'Rishikesh Kumar', 'Rohini Menon', 'Roselin Iyer', 'Rubini Subramaniam',
    'Sabarinath Reddy', 'Sabitha Patel', 'Sahana Varma', 'Sahaya Singh', 'Sakthivel Verma',
    'Sandhiya Das', 'Sangavi Rajan', 'Sangeetha Anandan', 'Sanjay Srinivasan', 'Sankar Balaji',
    'Saratha Kannan', 'Sarumathi Selvam', 'Sathishkumar Murugan', 'Sathy Chandra', 'Sathyanarayanan Babu',
    'Satyamurthy Devi', 'Selva Mehta', 'Selvakumar Mishra', 'Selvaraj Pandey', 'Selvi Ghosh',
    'Shankar Roy', 'Shanthi Nair', 'Sharon Pillai', 'Shobana Rao', 'Siddharth Sharma',
    'Sivakami Kumar', 'Sivakumar Menon', 'Sivapriya Iyer', 'Sivaranjani Subramaniam', 'Sivasankari Reddy',
];

const FACULTY_NAMES = [
    'Prof. Suresh Nair', 'Prof. Meena Rao', 'Prof. Arjun Pillai', 'Prof. Divya Krishnan', 'Prof. Naresh Babu',
    'Prof. Sangeetha Mohan', 'Prof. Vijay Kumar', 'Prof. Anjali Mehta', 'Prof. Rajesh Pillai', 'Prof. Kavitha Rajan',
    'Prof. Senthil Kumar', 'Prof. Rekha Nambiar', 'Prof. Mohan Raj', 'Prof. Padma Vasan', 'Prof. Vivek Anand',
    'Prof. Nithya Lakshmi', 'Prof. Arun Balaji', 'Prof. Mythili Prasad', 'Prof. Gopal Sundar', 'Prof. Janani Krishnan',
    'Prof. Sunil Chandra', 'Prof. Vimala Devi', 'Prof. Rajan Selvam', 'Prof. Deepika Srinivas', 'Prof. Ganesh Menon',
    'Prof. Deepa Iyer', 'Prof. Balaji Subramanian', 'Prof. Karan Mathur', 'Prof. Saravanan Karthik', 'Prof. Renuka Devi',
    'Prof. Mohanraj Prasad', 'Prof. Usha Rani', 'Prof. Ranjith Ramesh', 'Prof. Lavanya Bose', 'Prof. Sathish Kumar',
    'Prof. Meera Pillai', 'Prof. Chandran Nair', 'Prof. Bhuvana Rajan', 'Prof. Anand Roshan', 'Prof. Sumathy Thiyagarajan',
    'Prof. Vinod Krishnan', 'Prof. Shanthi Pandian', 'Prof. Murali Mohan', 'Prof. Geetha Ravi', 'Prof. Prasanna Kumar',
    'Prof. Nalini Suresh', 'Prof. Prakash Thiyagaraj', 'Prof. Saranya Devi', 'Prof. Anitha Raj', 'Prof. Sudhir Balan',
    'Prof. Malathi Sundaram', 'Prof. Deepak Nambiar', 'Prof. Preethi Menon', 'Prof. Kiran Babu', 'Prof. Vasantha Kumar',
    'Prof. Nirmala Devi', 'Prof. Balasubramanian Vijay', 'Prof. Kamala Devi', 'Prof. Selvaraj Pandian', 'Prof. Hemavathy Rajendran',
    'Prof. Pandian Krishnasamy', 'Prof. Suganya Murugesan', 'Prof. Thirumal Narayanan', 'Prof. Valarmathy Shanmugam',
    'Prof. Abinaya Velmurugan', 'Prof. Abirami Devi', 'Prof. Aravindhan Raju', 'Prof. Arthi Ramalingam', 'Prof. Ashok Kumar',
    'Prof. Aswin Ramesh', 'Prof. Balamurali Krishna', 'Prof. Barathi Devi', 'Prof. Chandra Mohan', 'Prof. Christy Solomon',
    'Prof. Dhanalakshmi Pandi', 'Prof. Dharani Kumar', 'Prof. Dinesh Babu', 'Prof. Durai Murugan', 'Prof. Esakki Muthu',
    'Prof. Ezhilmalan Raj', 'Prof. Ganesan Selvam', 'Prof. Gayathri Priya', 'Prof. Gobinath Rajan', 'Prof. Gokulakrishnan Das',
    'Prof. Hari Prasad', 'Prof. Hemalatha Subramaniam', 'Prof. Ilango Pandi', 'Prof. Indra Kumar', 'Prof. Jagan Nathan',
    'Prof. Jaisree Ramasamy', 'Prof. Jothi Lakshmi', 'Prof. Kalaiyarasi Murugan', 'Prof. Kalimuthu Pandian', 'Prof. Kanagadurai Rajan',
    'Prof. Kavimani Selvan', 'Prof. Kiruba Shankar', 'Prof. Kumaresan Velu',
    'Prof. Lalitha Srinivasan', 'Prof. Logesh Murugan', 'Prof. Mahalakshmi Venkat',
];

const INCHARGE_NAMES = [
    // Mess (1)
    { name: 'Mess Manager', domain: 'mess', password: 'mess123', facultyId: 'mess001' },
    // Transport (1)
    { name: 'Transport Head', domain: 'transport', password: 'transport123', facultyId: 'transport001' },
    // Hostel (1)
    { name: 'Hostel Manager', domain: 'hostel', password: 'hostel123', facultyId: 'hostel001' },
    // Sanitation (1)
    { name: 'Sanitation Head', domain: 'sanitation', password: 'sanitation123', facultyId: 'sanitation001' },
];

const DEPT_DEFS = [
    { name: 'Computer Science Engineering', code: 'CSE', cluster: 'CS Cluster', hodName: 'Dr. Rajesh Kumar', hodId: 'CSH01' },
    { name: 'Information Technology', code: 'IT', cluster: 'CS Cluster', hodName: 'Dr. Priya Sharma', hodId: 'ITH01' },
    { name: 'Computer Science & Business', code: 'CSBS', cluster: 'CS Cluster', hodName: 'Dr. Karthik Menon', hodId: 'CSB01' },
    { name: 'Mechanical Engineering', code: 'MECH', cluster: 'Core Cluster', hodName: 'Dr. Anil Verma', hodId: 'MEH01' },
    { name: 'Electronics & Communication', code: 'ECE', cluster: 'Core Cluster', hodName: 'Dr. Subramanian R', hodId: 'ECH01' },
    { name: 'Electrical & Electronics', code: 'EEE', cluster: 'Core Cluster', hodName: 'Dr. Lakshmi Nair', hodId: 'EEH01' },
    { name: 'Biotechnology', code: 'BIOTECH', cluster: 'Core Cluster', hodName: 'Dr. Shobha Iyer', hodId: 'BTH01' },
    { name: 'Agriculture Engineering', code: 'AGRI', cluster: 'Core Cluster', hodName: 'Dr. Venkat Raman', hodId: 'AGH01' },
    { name: 'Computer Technology', code: 'CT', cluster: 'CS Cluster', hodName: 'Dr. Venkatasamy G', hodId: 'CTH01' },
    { name: 'Information Science & Engineering', code: 'ISE', cluster: 'CS Cluster', hodName: 'Dr. Malarvizhi K', hodId: 'SEH01' },
];

const SUBJECT_TEMPLATES = {
    CSE: [
        ['Calculus & Linear Algebra', 'Engineering Physics', 'Engineering Chemistry', 'Engineering Graphics', 'Programming in C'],
        ['Probability & Statistics', 'Digital Systems Design', 'Data Structures', 'Object Oriented Programming', 'Computer Organization'],
        ['Design & Analysis of Algorithms', 'Operating Systems', 'Database Management Systems', 'Software Engineering', 'Discrete Mathematics'],
        ['Computer Networks', 'Compiler Design', 'Theory of Computation', 'Web Technologies', 'Microprocessors & Microcontrollers'],
        ['Artificial Intelligence', 'Machine Learning', 'Cloud Computing', 'Cryptography & Network Security', 'Mobile Application Development'],
        ['Deep Learning', 'Big Data Analytics', 'Internet of Things', 'Distributed Systems', 'Soft Computing'],
        ['Natural Language Processing', 'Computer Vision', 'Blockchain Technology', 'Software Testing & QA', 'Professional Ethics'],
        ['Project Work (Phase I)', 'Project Work (Phase II)', 'Entrepreneurship & Innovation', 'IPR & Patent Law', 'Industry Internship Report'],
    ],
    IT: [
        ['Engineering Mathematics I', 'Engineering Physics', 'Basic Electrical Engineering', 'Engineering Graphics', 'Problem Solving with Python'],
        ['Engineering Mathematics II', 'Data Structures & Algorithms', 'Digital Electronics', 'Database Design', 'Web Design & Development'],
        ['Computer Networks', 'System Analysis & Design', 'Java Programming', 'Software Project Management', 'Linux Administration'],
        ['Network Security', 'Cloud Infrastructure', 'Business Analytics', 'Mobile Computing', 'Object-Oriented Design'],
        ['Big Data Processing', 'AI & Data Mining', 'Enterprise Resource Planning', 'Digital Marketing Technology', 'UI/UX Design'],
        ['Machine Learning Applications', 'DevOps Practices', 'IT Service Management', 'Cyber Security Tools', 'API Development & Integration'],
        ['Capstone Project Planning', 'Emerging Technologies', 'IT Governance', 'Agile Methodologies', 'Information Systems Audit'],
        ['Final Project (IT)', 'Startup Technology', 'IT Consulting', 'Open Source Development', 'Industry Training Report'],
    ],
    CSBS: [
        ['Business Mathematics', 'Principles of Management', 'Accounting & Finance', 'Business Communication', 'Fundamentals of Computing'],
        ['Statistics for Business', 'Business Economics', 'Database for Business', 'Spreadsheet Analytics', 'Business Process Modeling'],
        ['Operations Research', 'Marketing Management', 'Business Intelligence Tools', 'ERP Systems', 'Data Visualization'],
        ['Supply Chain Management', 'CRM Technologies', 'Business Law & Ethics', 'Financial Analytics', 'Human Resource Technology'],
        ['E-Commerce Technologies', 'IT Project Management', 'Business Forecasting', 'Decision Making Models', 'Digital Transformation'],
        ['Business Analytics & ML', 'Enterprise Systems', 'Risk Management', 'Innovation & Startups', 'Corporate Strategy'],
        ['Business Capstone I', 'Fintech Applications', 'Consulting Skills', 'Global Business Environment', 'Mergers & Acquisitions (IT)'],
        ['Business Capstone II', 'Entrepreneurship Management', 'Social Media Analytics', 'CSR & Governance', 'Placement Readiness'],
    ],
    MECH: [
        ['Engineering Mathematics I', 'Engineering Physics', 'Engineering Chemistry', 'Engineering Graphics & AutoCAD', 'Workshop Practice'],
        ['Engineering Mathematics II', 'Mechanics of Solids', 'Engineering Thermodynamics', 'Manufacturing Processes I', 'Fluid Mechanics'],
        ['Design of Machine Elements', 'Kinematics of Machinery', 'Manufacturing Processes II', 'Material Science & Metallurgy', 'Thermal Engineering'],
        ['Dynamics of Machinery', 'Heat Transfer', 'CNC Machining & Robotics', 'Industrial Metrology', 'Automobile Engineering'],
        ['Advanced Manufacturing', 'Finite Element Analysis', 'Industrial Engineering', 'Refrigeration & Air Conditioning', 'Mechatronics'],
        ['CAD/CAM', 'Tribology', 'Non-Destructive Testing', 'Renewable Energy Systems', 'Robotics & Automation'],
        ['Product Design & Development', 'Industrial Safety & Management', 'Operations Management', 'Composite Materials', 'Hydraulics & Pneumatics'],
        ['Project (MECH Phase I)', 'Project (MECH Phase II)', 'Total Quality Management', 'Entrepreneurship for Engineers', 'Industry Internship'],
    ],
    ECE: [
        ['Engineering Mathematics I', 'Engineering Physics', 'Basic Electronics', 'Engineering Graphics', 'Problem Solving in Python'],
        ['Engineering Mathematics II', 'Network Analysis', 'Electronic Devices & Circuits', 'Digital Electronics', 'Signals & Systems'],
        ['Analog Circuits', 'Digital Communication', 'Electromagnetic Fields', 'Microprocessors & Interfaces', 'Linear Integrated Circuits'],
        ['VLSI Design', 'Communication Systems', 'Control Systems', 'Digital Signal Processing', 'Antenna & Wave Propagation'],
        ['RF & Microwave Engineering', 'Optical Communication', 'Robotics & Embedded Systems', 'Wireless Networks', 'Image Processing'],
        ['IoT System Design', 'FPGA Design', 'Satellite Communication', 'Medical Electronics', 'PCB Design & Testing'],
        ['AI for Signal Processing', '5G Technologies', 'Cognitive Radio Networks', 'Smart Grid Technology', 'Biomedical Signal Analysis'],
        ['Project (ECE Phase I)', 'Project (ECE Phase II)', 'Technology Entrepreneurship', 'Spectrum Management', 'Industry Training Report'],
    ],
    EEE: [
        ['Engineering Mathematics I', 'Engineering Physics', 'Basic Mechanical Engineering', 'Engineering Graphics', 'Introduction to EEE'],
        ['Engineering Mathematics II', 'Circuit Theory', 'Electronic Devices & Circuits', 'Electrical Machines I', 'Measurements & Instrumentation'],
        ['Power Systems I', 'Digital Electronics', 'Control Systems', 'Electrical Machines II', 'Electromagnetic Theory'],
        ['Power Systems II', 'Power Electronics', 'Microprocessors in Electrical Systems', 'High Voltage Engineering', 'Switchgear & Protection'],
        ['Power System Analysis', 'Special Electrical Machines', 'Renewable Energy Systems', 'Industrial Drives & Control', 'Digital Control Systems'],
        ['Power Quality', 'Smart Grid Technology', 'Energy Auditing & Management', 'Flexible AC Transmission', 'Electric Vehicles'],
        ['Substation Design', 'Distributed Generation', 'SCADA Systems', 'Energy Storage Technologies', 'Professional Ethics in Engineering'],
        ['Project (EEE Phase I)', 'Project (EEE Phase II)', 'Power Market Economics', 'Grid Integration of Renewables', 'Industry Internship'],
    ],
    BIOTECH: [
        ['Biological Chemistry I', 'Mathematics for Biotechnology', 'Physics for Life Sciences', 'Introduction to Biotechnology', 'Laboratory Skills'],
        ['Biological Chemistry II', 'Cell Biology & Genetics', 'Microbiology', 'Biophysics', 'Biostatistics'],
        ['Molecular Biology', 'Enzymology', 'Immunology', 'Bioinformatics I', 'Fermentation Technology'],
        ['Genetic Engineering', 'Downstream Processing', 'Plant Biotechnology', 'Bioinformatics II', 'Bioethics & IPR'],
        ['Industrial Biotechnology', 'Environmental Biotechnology', 'Medical Biotechnology', 'Genomics & Proteomics', 'Bioreactor Design'],
        ['Drug Delivery Systems', 'Animal Cell Technology', 'Systems Biology', 'Nano Biotechnology', 'Food Biotechnology'],
        ['Cancer Biology', 'Stem Cell Technology', 'Marine Biotechnology', 'Regulatory Affairs in Biotech', 'Biosafety & Risk Assessment'],
        ['Project (Biotech Phase I)', 'Project (Biotech Phase II)', 'Bioprocess Scale-up', 'Entrepreneurship in Biotech', 'Internship Report'],
    ],
    AGRI: [
        ['Agricultural Mathematics', 'Agricultural Physics', 'Agricultural Chemistry', 'Introduction to Agricultural Engineering', 'Farm Machinery I'],
        ['Soil & Water Conservation', 'Agricultural Biology', 'Irrigation & Drainage Engineering', 'Farm Machinery II', 'Agronomy I'],
        ['Land & Water Resources', 'Agricultural Mechanization', 'Post Harvest Technology', 'Agronomy II', 'Agricultural Meteorology'],
        ['Precision Agriculture', 'Agricultural Structures', 'Crop Science', 'Remote Sensing in Agriculture', 'Agricultural Economics'],
        ['GIS for Agriculture', 'Agricultural Electrification', 'Food Processing Engineering', 'Protected Cultivation', 'Agricultural Statistics'],
        ['Watershed Management', 'Renewable Energy in Agriculture', 'Agricultural Information Systems', 'Drip Irrigation Design', 'Weed Science'],
        ['Agri-Business Management', 'Rural Development Technology', 'Climate-Smart Agriculture', 'Vertical Farming Systems', 'Agricultural Policy'],
        ['Project (Agri Phase I)', 'Project (Agri Phase II)', 'Farm Management', 'Organic Farming Technology', 'Industry Attachment Report'],
    ],
    CT: [
        ['Analog & Digital Electronics', 'C Programming', 'Mathematics I', 'Physics', 'Engineering Graphics'],
        ['Data Structures', 'Algorithm Design', 'Mathematics II', 'Computer Architecture', 'Environmental Science'],
        ['Operating Systems', 'Database Systems', 'Java Programming', 'Software Engineering', 'Discrete Mathematics'],
        ['Computer Networks', 'Web Technologies', 'Microprocessors', 'Theory of Computation', 'System Software'],
        ['Cloud Computing', 'Machine Learning', 'AI Principles', 'Cyber Security', 'Mobile App Development'],
        ['Internet of Things', 'Big Data', 'Network Security', 'Distributed Systems', 'Compiler Design'],
        ['Data Science', 'Blockchain', 'Deep Learning', 'Software Testing', 'Ethics Guidelines'],
        ['Project Phase I', 'Project Phase II', 'Startup Management', 'Intellectual Property', 'Internship'],
    ],
    ISE: [
        ['Mathematics I', 'Physics', 'Digital Logic', 'C Programming', 'Engineering Graphics'],
        ['Mathematics II', 'Data Structures', 'Object Oriented Programming', 'Computer Organization', 'Environmental Science'],
        ['Database Management', 'Software Engineering', 'Operating Systems', 'Java Programming', 'Discrete Mathematics'],
        ['Web Programming', 'Computer Networks', 'Theory of Computation', 'Design of Algorithms', 'Information Security'],
        ['Cloud Architecture', 'Machine Learning Algorithms', 'AI Systems', 'Cryptography', 'Mobile Computing'],
        ['IoT Systems', 'Data Analytics', 'Advanced Networks', 'Information Retrieval', 'System Design'],
        ['Data Mining', 'Blockchain Tech', 'Neural Networks', 'Testing & QA', 'Professional Ethics'],
        ['Project Phase I', 'Project Phase II', 'Innovation Strategy', 'Patent Laws', 'Industry Training'],
    ],
};

const DOMAIN_DEFS = [
    {
        name: 'Transport', slug: 'transport', icon: 'FiTruck', description: 'Transport feedback', residenceRestriction: 'none', questions: [
            { text: 'How would you rate the punctuality of college transport?', type: 'rating' },
            { text: 'How satisfied are you with the cleanliness of buses?', type: 'rating' },
            { text: 'How would you rate the behaviour of transport staff?', type: 'rating' },
            { text: 'How comfortable is the ride overall?', type: 'rating' },
            { text: 'Please share any additional feedback about transport.', type: 'text', required: false },
        ]
    },
    {
        name: 'Mess', slug: 'mess', icon: 'FiCoffee', description: 'Mess feedback', residenceRestriction: 'none', questions: [
            { text: 'How would you rate the quality of food served?', type: 'rating' },
            { text: 'How satisfied are you with the variety of menu items?', type: 'rating' },
            { text: 'How would you rate the cleanliness of the mess area?', type: 'rating' },
            { text: 'How would you rate the service speed?', type: 'rating' },
            { text: 'Please share any suggestions to improve the mess.', type: 'text', required: false },
        ]
    },
    {
        name: 'Hostel', slug: 'hostel', icon: 'FiHome', description: 'Hostel feedback', residenceRestriction: 'hosteller', questions: [
            { text: 'How would you rate the cleanliness of your hostel room?', type: 'rating' },
            { text: 'How satisfied are you with the facilities (water, electricity, Wi-Fi)?', type: 'rating' },
            { text: 'How would you rate the hostel staff behaviour and responsiveness?', type: 'rating' },
            { text: 'How safe and secure do you feel in the hostel?', type: 'rating' },
            { text: 'Please share any additional feedback about hostel facilities.', type: 'text', required: false },
        ]
    },
    {
        name: 'Sanitation', slug: 'sanitation', icon: 'FiTrash2', description: 'Sanitation feedback', residenceRestriction: 'none', questions: [
            { text: 'How would you rate the cleanliness of restrooms?', type: 'rating' },
            { text: 'How satisfied are you with the waste disposal management?', type: 'rating' },
            { text: 'How would you rate campus outdoor cleanliness?', type: 'rating' },
            { text: 'How frequently are sanitation facilities maintained?', type: 'rating' },
            { text: 'Please report specific sanitation concerns or suggestions.', type: 'text', required: false },
        ]
    },
];

/**
 * Converts a full name like "Prof. Suresh Nair" or "Ananya Krishnan"
 * into an email-safe slug, e.g. "suresh.nair" or "ananya.krishnan"
 */
function nameToEmailLocal(fullName) {
    const parts = fullName
        .toLowerCase()
        .replace(/^(prof\.|dr\.|mr\.|ms\.|mrs\.)\s*/i, '') // strip titles
        .trim()
        .split(/\s+/);
    
    if (parts.length >= 2) {
        return `${parts[0]}.${parts.slice(1).join('')}`;
    }
    return parts[0];
}

const seed = async () => {
    await connectDB();
    console.log('\n⚙️ Connected to DB. Running bitsathy seed with real names...\n');

    await User.deleteMany({});
    await Domain.deleteMany({});
    await Department.deleteMany({});
    await Subject.deleteMany({});
    await Feedback.deleteMany({});
    await DomainFeedback.deleteMany({});

    // ── 1. Departments ──────────────────────────────────────────────
    const deptDocs = await Department.insertMany(
        DEPT_DEFS.map(d => ({
            name: d.name, code: d.code, cluster: d.cluster,
            hodName: d.hodName, description: d.name, isActive: true,
        }))
    );
    const deptMap = {};
    deptDocs.forEach(d => { deptMap[d.code] = d; });
    const deptIds = Object.values(deptMap).map(d => d._id);
    console.log(`✅ ${deptDocs.length} departments seeded\n`);

    const usedEmails = new Set();
    console.log('👨‍💼 Seeding HODs for all departments...');
    for (const d of DEPT_DEFS) {
        const deptDoc = deptMap[d.code];
        const emailLocal = `hod.${d.code.toLowerCase()}`;
        usedEmails.add(emailLocal);

        await User.create({
            name: d.hodName,
            email: `${emailLocal}@bitsathy.in`,
            password: `hod${d.code.toLowerCase()}123`,
            role: 'hod',
            department: deptDoc._id,
            hodId: d.hodId
        });
    }
    console.log(`✅ HODs seeded\n`);

    // ── 2. Faculties (100) ──────────────────────────────────────────
    console.log('👨‍🏫 Seeding 100 faculties...');
    const facultyDocs = [];

    for (let i = 0; i < 100; i++) {
        const fullName = FACULTY_NAMES[i];
        let emailLocal = nameToEmailLocal(fullName);
        // Handle duplicates
        if (usedEmails.has(emailLocal)) {
            emailLocal = `${emailLocal}${i + 1}`;
        }
        usedEmails.add(emailLocal);
        // Assign 10 per department strictly
        const assignedDeptId = deptIds[i % deptIds.length];

        const fac = await User.create({
            name: fullName,
            email: `${emailLocal}@bitsathy.in`,
            password: 'faculty123',
            role: 'faculty',
            facultyId: `FAC${String(i + 1).padStart(3, '0')}`,
            department: assignedDeptId,
        });
        facultyDocs.push(fac);
    }
    console.log(`✅ 100 faculties seeded\n`);

    // Group faculties precisely by department for valid subject assignment loop later
    const facultiesByDept = {};
    for (const fac of facultyDocs) {
        const dId = fac.department.toString();
        if (!facultiesByDept[dId]) facultiesByDept[dId] = [];
        facultiesByDept[dId].push(fac);
    }

    // ── 3. Subjects & assignment ────────────────────────────────────
    console.log('📚 Seeding subjects and assigning to faculties (1–3 each)...');
    const allSubjects = [];
    let subjectCount = 0;

    for (const dept of DEPT_DEFS) {
        const deptDoc = deptMap[dept.code];
        const templates = SUBJECT_TEMPLATES[dept.code];
        
        // Grab the valid faculties specifically localized to this department
        const localFaculties = facultiesByDept[deptDoc._id.toString()] || [];

        for (let semIdx = 0; semIdx < 8; semIdx++) {
            for (let subIdx = 0; subIdx < 5; subIdx++) {
                let facDoc = null;
                
                // Assign a faculty evenly exclusively from this department's pool
                if (localFaculties.length > 0) {
                    // Rotate over the available departmental faculties (e.g. 10)
                    facDoc = localFaculties[subjectCount % localFaculties.length];
                }

                allSubjects.push({
                    name: templates[semIdx][subIdx],
                    subjectCode: `${dept.code}${semIdx + 1}0${subIdx + 1}`,
                    department: deptDoc._id,
                    facultyName: facDoc ? facDoc.name : 'TBA',
                    facultyEmail: facDoc ? facDoc.email : '',
                    faculty: facDoc ? facDoc._id : null,
                    semester: semIdx + 1,
                    academicYear: ACADEMIC_YEAR,
                    isActive: true,
                });
                subjectCount++;
            }
        }
    }
    const subjectDocs = await Subject.insertMany(allSubjects);

    for (const subj of subjectDocs) {
        if (subj.faculty) {
            await User.findByIdAndUpdate(subj.faculty, {
                $addToSet: { assignedSubjects: subj._id },
            });
        }
    }
    console.log(`✅ ${subjectDocs.length} subjects seeded, 300 assigned to faculty\n`);

    // ── 4. Students (600) ───────────────────────────────────────────
    console.log('👩‍🎓 Seeding 600 students (60 per department)...');
    // Shuffle student names so distribution is random
    const shuffled = [...STUDENT_NAMES].sort(() => Math.random() - 0.5);

    for (let i = 0; i < 600; i++) {
        const fullName = shuffled[i % shuffled.length];
        let emailLocal = nameToEmailLocal(fullName);
        // Handle duplicates
        if (usedEmails.has(emailLocal)) {
            emailLocal = `${emailLocal}${i + 1}`;
        }
        usedEmails.add(emailLocal);

        // Assign 60 per department
        const deptIndex = Math.floor(i / 60);

        await User.create({
            name: fullName,
            email: `${emailLocal}@bitsathy.in`,
            password: 'student123',
            role: 'student',
            rollNumber: `STU${String(i + 1).padStart(4, '0')}`,
            department: deptIds[deptIndex],
            semester: Math.floor(Math.random() * 8) + 1,
            residenceType: Math.random() > 0.5 ? 'hosteller' : 'dayscholar',
        });
    }
    console.log(`✅ 600 students seeded\n`);

    // ── 5. Incharges ────────────────────────────────────────────────
    console.log('🔑 Seeding 4 domain incharges...');
    for (const inc of INCHARGE_NAMES) {
        const emailLocal = inc.domain; // user explicitly asked for transport@, mess@, etc.
        usedEmails.add(emailLocal);

        await User.create({
            name: inc.name,
            email: `${emailLocal}@bitsathy.in`,
            password: inc.password,
            role: 'domain_head',
            facultyId: inc.facultyId,
            assignedDomain: inc.domain,
        });
        console.log(`   ✅ ${emailLocal}@bitsathy.in (${inc.domain}) / ID: ${inc.facultyId} / ${inc.password}`);
    }
    console.log();

    // ── 6. Admin, Dean, Principal ───────────────────────────────────
    console.log('👤 Seeding Admin, Dean, Principal...');
    await User.create({ name: 'System Admin', email: 'admin@bitsathy.in', password: 'admin123', role: 'admin' });
    await User.create({ name: 'Dean', email: 'dean@bitsathy.in', password: 'admin123', role: 'dean' });
    await User.create({ name: 'Principal', email: 'principal@bitsathy.in', password: 'principal123', role: 'principal' });
    console.log('✅ Admin / dean / principal seeded\n');

    // ── 7. Domain configs ───────────────────────────────────────────
    console.log('🌐 Seeding 4 domain configurations...');
    for (const d of DOMAIN_DEFS) {
        await Domain.create({ name: d.name, slug: d.slug, icon: d.icon, description: d.description, residenceRestriction: d.residenceRestriction, questions: d.questions, isActive: true });
        console.log(`   ✅ ${d.slug} domain (${d.questions.length} questions)`);
    }

    console.log('\n══════════════════════════════════════════════════════════');
    console.log('🎉  BITSATHY SEED COMPLETE!');
    console.log('══════════════════════════════════════════════════════════');
    console.log('\n📋 Credential Summary:');
    console.log('┌──────────────────────┬─────────────────────────────────────────┬────────────────┐');
    console.log('│ Role                 │ Email pattern                           │ Password       │');
    console.log('├──────────────────────┼─────────────────────────────────────────┼────────────────┤');
    console.log('│ Students (600)       │ firstname.lastname@bitsathy.in          │ student123     │');
    console.log('│ Faculty (100)        │ firstname.lastname@bitsathy.in          │ faculty123     │');
    console.log('│ Mess Incharge (2)    │ sunita.sharma@bitsathy.in etc.          │ mess123        │');
    console.log('│ Transport Incharge   │ ravi.kumar@bitsathy.in                  │ transport123   │');
    console.log('│ Hostel Incharge (3)  │ anil.mehta@bitsathy.in etc.             │ hostel123      │');
    console.log('│ Sanitation Incharge  │ priya.das@bitsathy.in etc.              │ sanitation123  │');
    console.log('│ Admin                │ admin@bitsathy.in                       │ admin123       │');
    console.log('│ Dean                 │ dean@bitsathy.in                        │ admin123       │');
    console.log('│ Principal            │ principal@bitsathy.in                   │ admin123       │');
    console.log('└──────────────────────┴─────────────────────────────────────────┴────────────────┘');
    console.log();
};

seed().catch(err => {
    console.error('\n❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
}).finally(() => {
    mongoose.disconnect();
});
