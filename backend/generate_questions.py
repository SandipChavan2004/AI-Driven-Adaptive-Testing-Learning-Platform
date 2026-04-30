import json
import os

explanation_topics = {
    'Cloud Computing': [
        "Explain the difference between IaaS, PaaS, and SaaS.",
        "How does a load balancer work in a cloud environment?",
        "What is horizontal scaling vs vertical scaling?",
        "Explain the concept of Serverless computing.",
        "What is a Content Delivery Network (CDN) and how does it work?",
        "Explain the role of Docker in cloud computing.",
        "What is Kubernetes and why is it used?",
        "Explain the concept of Infrastructure as Code (IaC).",
        "How do auto-scaling groups work?",
        "What are the security benefits of using a Virtual Private Cloud (VPC)?",
        "Explain the concept of a multi-cloud strategy.",
        "What is edge computing and how does it relate to cloud?"
    ],
    'Data Structures': [
        "Explain how a Hash Table works, including collision resolution.",
        "What is the difference between an Array and a Linked List?",
        "Explain the concept of a Binary Search Tree (BST).",
        "How does a Stack differ from a Queue?",
        "Explain the workings of a Priority Queue.",
        "What is a Graph and what are its common representations?",
        "Explain Depth-First Search (DFS) vs Breadth-First Search (BFS).",
        "What is a Trie and what are its applications?",
        "Explain the concept of a Heap data structure.",
        "How does an AVL tree maintain its balance?",
        "Explain the use case of a Disjoint Set (Union-Find).",
        "What is a Doubly Linked List and when is it preferred?"
    ],
    'Algorithm': [
        "Explain the QuickSort algorithm and its time complexity.",
        "How does MergeSort work?",
        "What is Dynamic Programming and when should it be used?",
        "Explain Dijkstra's Algorithm for shortest paths.",
        "What is the Greedy approach in algorithm design?",
        "Explain the Knapsack problem.",
        "How does Binary Search work and what are its prerequisites?",
        "What is the A* search algorithm?",
        "Explain the concept of Backtracking.",
        "How do you detect a cycle in a directed graph?",
        "What is the difference between NP-Complete and NP-Hard?",
        "Explain the sliding window technique."
    ],
    'DBMS': [
        "Explain the ACID properties of a transaction.",
        "What is database normalization and its normal forms?",
        "Explain the difference between SQL and NoSQL databases.",
        "How do database indexes work to speed up queries?",
        "What is a foreign key and why is it important?",
        "Explain the difference between INNER JOIN and OUTER JOIN.",
        "What is a stored procedure?",
        "Explain the concept of a database trigger.",
        "What is a materialized view?",
        "How does a two-phase commit protocol work?",
        "Explain the CAP theorem.",
        "What are database deadlocks and how can they be prevented?"
    ],
    'Networking': [
        "Explain the OSI model and its 7 layers.",
        "What is the difference between TCP and UDP?",
        "How does the Three-Way Handshake work in TCP?",
        "Explain the purpose of the DNS system.",
        "How does a router differ from a switch?",
        "What is a subnet mask and how is it used?",
        "Explain the HTTP vs HTTPS protocols.",
        "What is the role of ARP (Address Resolution Protocol)?",
        "How do firewalls work to secure a network?",
        "Explain the concept of NAT (Network Address Translation).",
        "What is the BGP protocol?",
        "How do VPNs work to provide a secure connection?"
    ],
    'OS': [
        "Explain the difference between a process and a thread.",
        "What is virtual memory and how does it work?",
        "Explain the concept of paging and segmentation.",
        "What are deadlocks and what are the four necessary conditions for them?",
        "Explain the round-robin CPU scheduling algorithm.",
        "What is a mutex and how does it differ from a semaphore?",
        "Explain the concept of context switching.",
        "What is thrashing in an operating system?",
        "How does a file system manage disk space?",
        "Explain the concept of an interrupt.",
        "What is the difference between user mode and kernel mode?",
        "How do operating systems handle race conditions?"
    ],
    'OOP': [
        "Explain the four main principles of Object-Oriented Programming.",
        "What is the difference between abstract classes and interfaces?",
        "Explain the concept of method overloading vs method overriding.",
        "What is encapsulation and why is it useful?",
        "Explain the Singleton design pattern.",
        "What is polymorphism in OOP?",
        "How does inheritance promote code reuse?",
        "Explain the Factory design pattern.",
        "What is the difference between composition and inheritance?",
        "Explain the Observer design pattern.",
        "What are getters and setters?",
        "How do constructors and destructors work?"
    ],
    'Machine Learning': [
        "Explain the difference between supervised and unsupervised learning.",
        "What is over-fitting and how can it be prevented?",
        "Explain how a Decision Tree works.",
        "What is a Neural Network and what are its components?",
        "Explain the concept of Gradient Descent.",
        "What is Cross-Validation in machine learning?",
        "Explain the difference between classification and regression.",
        "What is a Random Forest algorithm?",
        "Explain the concept of K-Means clustering.",
        "What are Support Vector Machines (SVM)?",
        "Explain the role of activation functions in neural networks.",
        "What is the difference between precision and recall?"
    ],
    'WebTech': [
        "Explain the difference between client-side and server-side rendering.",
        "What is the Virtual DOM in React?",
        "Explain the REST architectural style.",
        "How do cookies differ from local storage and session storage?",
        "What is CORS and why is it important?",
        "Explain the Event Loop in JavaScript.",
        "What are Promises and how do they work in JavaScript?",
        "Explain the concept of responsive web design.",
        "What is GraphQL and how does it differ from REST?",
        "How do web sockets enable real-time communication?",
        "Explain the role of CSS Flexbox vs Grid.",
        "What are progressive web apps (PWAs)?"
    ]
}

project_tasks = {
    'Python': [
        "Write a Python script to scrape product prices from an e-commerce website.",
        "Develop a simple REST API in FastAPI to manage a to-do list.",
        "Write a Python program to parse a CSV file and output summary statistics.",
        "Create a Python decorator that logs the execution time of a function.",
        "Implement a binary search algorithm in Python.",
        "Write a Python script to resize and compress a directory of images.",
        "Develop a simple command-line tic-tac-toe game in Python.",
        "Write a Python script to fetch data from an external API and store it in a local SQLite database.",
        "Create a basic web server using Python's built-in modules (no frameworks).",
        "Write a script that automates the organization of files in a downloads folder based on extensions.",
        "Implement a simple caching mechanism for expensive function calls in Python.",
        "Write a Python function to validate an email address using regular expressions."
    ],
    'DBMS': [
        "Write an SQL query to find the 2nd highest salary from an Employee table.",
        "Write a query to join three tables: Users, Orders, and Products, returning the total spent by each user.",
        "Create a stored procedure that updates a user's balance and logs the transaction.",
        "Write an SQL query to find all users who have not made a purchase in the last 30 days.",
        "Write a query using a window function to rank employees by salary within their respective departments.",
        "Design a schema for a library management system with Authors, Books, and Loans tables.",
        "Write an SQL trigger that automatically updates the 'last_modified' timestamp on a record update.",
        "Write a query to find the top 3 most popular products based on order quantities.",
        "Write an SQL query that identifies duplicate email addresses in a Users table.",
        "Create a materialized view that stores daily sales summaries.",
        "Write a query using a CTE (Common Table Expression) to calculate recursive hierarchies (e.g. employee-manager).",
        "Write an SQL query to pivot a table of monthly sales data into columns for each month."
    ],
    'Java': [
        "Implement a thread-safe Singleton class in Java.",
        "Write a Java program to simulate a producer-consumer problem using threads.",
        "Create a Java interface and two classes implementing it to demonstrate polymorphism.",
        "Write a Java method to reverse a string without using built-in reverse functions.",
        "Implement a simple HTTP client in Java to fetch and print the contents of a webpage.",
        "Write a Java program to read a text file, count the frequency of each word, and print the top 10.",
        "Create a custom Exception class in Java and demonstrate its usage.",
        "Implement a generic Stack data structure in Java.",
        "Write a Java program using Java Streams to filter and sort a list of objects.",
        "Develop a simple Spring Boot controller that handles a GET request and returns JSON.",
        "Write a Java program to perform matrix multiplication.",
        "Implement the Observer design pattern in Java for a simple weather station application."
    ],
    'JavaScript': [
        "Write a JavaScript function that debounces a given function.",
        "Implement a simple single-page routing mechanism in Vanilla JavaScript.",
        "Write a React component that fetches data from an API and displays it in a table.",
        "Create a Node.js script using Express to serve static files from a directory.",
        "Write a JavaScript function to deep clone an object.",
        "Implement a simple drag-and-drop interface using the HTML5 Drag and Drop API.",
        "Write a function using Promises to fetch data from 3 different APIs sequentially.",
        "Create a custom React hook that manages a toggle state.",
        "Write a JavaScript script to validate a form before submission without using HTML5 validation.",
        "Implement a basic Redux-like state management system from scratch.",
        "Write a WebGL snippet to render a rotating colored triangle.",
        "Create a Node.js script that reads a large file line-by-line efficiently using streams."
    ],
    'Data Structures': [
        "Implement a Trie in C++ or Python to support autocomplete functionality.",
        "Write a program to perform a level-order traversal of a binary tree.",
        "Implement a Least Recently Used (LRU) Cache.",
        "Write code to reverse a linked list in-place.",
        "Implement a Min-Heap from scratch.",
        "Write a function to detect and remove a loop in a linked list.",
        "Implement Dijkstra's algorithm to find the shortest path in a graph.",
        "Write a program to balance an unbalanced binary search tree.",
        "Implement a Hash Map with linear probing for collision resolution.",
        "Write a function to find the lowest common ancestor (LCA) of two nodes in a binary tree.",
        "Implement a queue using two stacks.",
        "Write a program to topologically sort a directed acyclic graph (DAG)."
    ],
    'DevOps': [
        "Write a basic Dockerfile for a Node.js application.",
        "Create a GitHub Actions workflow that runs tests on every push to the main branch.",
        "Write a bash script that backs up a specified directory to an AWS S3 bucket.",
        "Create a docker-compose.yml file that sets up a web server and a PostgreSQL database.",
        "Write a simple Terraform script to provision an EC2 instance.",
        "Create an Nginx configuration file to act as a reverse proxy for a Node application.",
        "Write a cron job specification that runs a cleanup script every Sunday at 3 AM.",
        "Write a script to monitor CPU usage and send an alert if it exceeds 90%.",
        "Create an Ansible playbook to install and configure Apache on a target server.",
        "Write a basic Kubernetes deployment YAML file for a stateless web application.",
        "Create a Prometheus configuration to scrape metrics from an endpoint.",
        "Write a bash script to parse a web server access log and find the top 10 IP addresses."
    ],
    'C Programming': [
        "Write a C program to implement a doubly linked list.",
        "Implement quicksort algorithm in C using pointers.",
        "Write a C program that reads a file and outputs the hexadecimal representation of its contents.",
        "Create a C program that uses fork() to create child processes and communicate via pipes.",
        "Write a C program to implement a thread pool using pthreads.",
        "Implement a basic dynamic memory allocator (malloc/free) in C.",
        "Write a C program to reverse a string in place using pointers.",
        "Create a C program to multiply two matrices efficiently.",
        "Write a C program that implements a basic circular queue.",
        "Implement a C program that uses bitwise operations to count set bits in an integer.",
        "Write a C network server that listens on a port and echoes received messages.",
        "Create a C program to parse command line arguments using getopt."
    ],
    'Cloud Computing': [
        "Write an AWS Lambda function in Python that triggers on S3 object creation and generates a thumbnail.",
        "Create an AWS CloudFormation template to deploy an S3 bucket and a DynamoDB table.",
        "Write a script using the boto3 library to list all running EC2 instances.",
        "Develop an Azure Function in JavaScript that handles HTTP triggers.",
        "Create a Google Cloud Build configuration file to deploy a container to Cloud Run.",
        "Write a script using the AWS CLI to create a new IAM user and attach a read-only policy.",
        "Implement a basic serverless API using API Gateway and Lambda.",
        "Write a Python script to query an Athena table and save results locally.",
        "Create a configuration for an AWS Auto Scaling group scaling based on CPU utilization.",
        "Write a script to automate the backup of an RDS database snapshot.",
        "Deploy a static website to an S3 bucket using the AWS CLI.",
        "Create an Azure Resource Manager (ARM) template for a storage account."
    ],
    'Machine Learning': [
        "Write a Python script using scikit-learn to train a Random Forest classifier on the Iris dataset.",
        "Implement linear regression from scratch using numpy.",
        "Write a PyTorch script to build and train a simple CNN on the MNIST dataset.",
        "Create a Python function that performs K-Fold cross-validation on a given model and dataset.",
        "Write a script using pandas to handle missing values and encode categorical variables.",
        "Implement K-Means clustering algorithm from scratch in Python.",
        "Write a TensorFlow/Keras script to create an autoencoder for dimensionality reduction.",
        "Create a pipeline in scikit-learn that scales features and applies an SVM classifier.",
        "Write a Python script to calculate TF-IDF for a corpus of documents.",
        "Implement a simple collaborative filtering recommendation system.",
        "Write a script to perform hyperparameter tuning using GridSearchCV.",
        "Create a custom loss function in PyTorch for an imbalanced classification problem."
    ]
}

# Expand to reach 100+ total
all_explanations = []
for subject, qs in explanation_topics.items():
    for q in qs:
        all_explanations.append({"subject": subject, "concept": q})

all_projects = []
for subject, qs in project_tasks.items():
    for q in qs:
        all_projects.append({"subject": subject, "task": q})

js_content = f"""// Auto-generated 100+ questions for Practice and Test
export const explanationQuestions = {json.dumps(all_explanations, indent=2)};

export const projectQuestions = {json.dumps(all_projects, indent=2)};

export const courseSuggestions = [
    {{ subject: 'Cloud Computing', course: 'AWS Certified Solutions Architect', url: 'https://aws.amazon.com/certification/' }},
    {{ subject: 'Cloud Computing', course: 'Google Cloud Professional Cloud Architect', url: 'https://cloud.google.com/certification/' }},
    {{ subject: 'Data Structures', course: 'Coursera - Algorithms Specialization by Stanford', url: 'https://www.coursera.org/specializations/algorithms' }},
    {{ subject: 'Data Structures', course: 'NPTEL - Data Structures and Algorithms', url: 'https://nptel.ac.in/' }},
    {{ subject: 'Algorithm', course: 'MIT 6.006 Introduction to Algorithms', url: 'https://ocw.mit.edu/' }},
    {{ subject: 'DBMS', course: 'Coursera - Database Systems Concepts & Design', url: 'https://www.coursera.org/learn/database-management' }},
    {{ subject: 'DBMS', course: 'NPTEL - Database Management System', url: 'https://nptel.ac.in/' }},
    {{ subject: 'Networking', course: 'Cisco CCNA Certification', url: 'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/associate/ccna.html' }},
    {{ subject: 'Networking', course: 'Coursera - Computer Communications', url: 'https://www.coursera.org/' }},
    {{ subject: 'OS', course: 'NPTEL - Operating System Fundamentals', url: 'https://nptel.ac.in/' }},
    {{ subject: 'OOP', course: 'Coursera - Object Oriented Programming in Java', url: 'https://www.coursera.org/learn/object-oriented-java' }},
    {{ subject: 'Machine Learning', course: 'Coursera - Machine Learning by Andrew Ng', url: 'https://www.coursera.org/specializations/machine-learning-introduction' }},
    {{ subject: 'Machine Learning', course: 'DeepLearning.AI - Deep Learning Specialization', url: 'https://www.coursera.org/specializations/deep-learning' }},
    {{ subject: 'WebTech', course: 'FreeCodeCamp - Full Stack Web Development', url: 'https://www.freecodecamp.org/' }},
    {{ subject: 'WebTech', course: 'Udemy - The Complete Web Developer Bootcamp', url: 'https://www.udemy.com/' }},
    {{ subject: 'Python', course: 'Coursera - Python for Everybody', url: 'https://www.coursera.org/specializations/python' }},
    {{ subject: 'Java', course: 'Udemy - Java Programming Masterclass', url: 'https://www.udemy.com/' }},
    {{ subject: 'JavaScript', course: 'Frontend Masters - Complete Intro to React', url: 'https://frontendmasters.com/' }},
    {{ subject: 'DevOps', course: 'Udemy - Docker and Kubernetes: The Complete Guide', url: 'https://www.udemy.com/' }},
    {{ subject: 'C Programming', course: 'Coursera - C for Everyone', url: 'https://www.coursera.org/specializations/c-programming' }}
];

export const getRandomItems = (arr, n) => {{
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}};

export const youtubeSuggestions = [
  {{ subject: 'Cloud Computing', channel: 'Simplilearn', url: 'https://www.youtube.com/watch?v=M988_fsOSWo', title: 'Cloud Computing Full Course' }},
  {{ subject: 'Data Structures', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=RBSGKlAvoiM', title: 'Data Structures Easy to Advanced' }},
  {{ subject: 'Algorithm', channel: 'Abdul Bari', url: 'https://www.youtube.com/watch?v=0IAPZzGSbME', title: 'Algorithms by Abdul Bari' }},
  {{ subject: 'DBMS', channel: 'Gate Smashers', url: 'https://www.youtube.com/watch?v=kBdlM6hNDAE', title: 'DBMS Full Course' }},
  {{ subject: 'Networking', channel: 'NetworkChuck', url: 'https://www.youtube.com/watch?v=IPvYjXCsTg8', title: 'FREE CCNA Course' }},
  {{ subject: 'OS', channel: 'Neso Academy', url: 'https://www.youtube.com/watch?v=vBURTt97EkA', title: 'Operating System Full Course' }},
  {{ subject: 'OOP', channel: 'Programming with Mosh', url: 'https://www.youtube.com/watch?v=pTB0EiLXUC8', title: 'Object-oriented Programming in 7 mins' }},
  {{ subject: 'Machine Learning', channel: 'StatQuest', url: 'https://www.youtube.com/watch?v=Gv9_4yMHFhI', title: 'Machine Learning Tutorial' }},
  {{ subject: 'WebTech', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=UqZXwCRxqmA', title: 'HTML Crash Course' }},
  {{ subject: 'Python', channel: 'Programming with Mosh', url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc', title: 'Python Tutorial for Beginners' }},
  {{ subject: 'Java', channel: 'Amigoscode', url: 'https://www.youtube.com/watch?v=grEKMHGYyns', title: 'Java Tutorial for Beginners' }},
  {{ subject: 'JavaScript', channel: 'Fireship', url: 'https://www.youtube.com/watch?v=DHjqpvDnNGE', title: 'JavaScript in 100 Seconds' }},
  {{ subject: 'DevOps', channel: 'TechWorld with Nana', url: 'https://www.youtube.com/watch?v=hQcFE0RD0cQ', title: 'Docker Tutorial for Beginners' }},
  {{ subject: 'C Programming', channel: 'Bro Code', url: 'https://www.youtube.com/watch?v=87SH2Cn0s9A', title: 'C Programming Full Course' }}
];
"""

os.makedirs(os.path.dirname('c:\\Users\\Sandip\\Downloads\\Project\\Student Pattern Analyser\\frontend\\src\\data\\questionsData.js'), exist_ok=True)
with open('c:\\Users\\Sandip\\Downloads\\Project\\Student Pattern Analyser\\frontend\\src\\data\\questionsData.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Generated {len(all_explanations)} explanations and {len(all_projects)} projects.")
