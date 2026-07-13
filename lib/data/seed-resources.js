// resource_type values are lowercase to match the DB CHECK constraint
// and the frontend icon lookup (both expect: course | video | article | doc | project)

export const seedResources = [

  // React
  { skill_name: "React", title: "React JS Full Course for Beginners 2026",
    provider: "freeCodeCamp", resource_type: "course", is_free: true,
    duration_hours: 2, difficulty_level: "beginner", priority: 1,
    description: "Learn React from scratch — components, hooks, state management and more.",
    url: "https://www.youtube.com/watch?v=bMknfKXIFA8" },
  { skill_name: "React", title: "The Ultimate React Course with Redux & Next.js",
    provider: "Udemy", resource_type: "course", is_free: false,
    duration_hours: 20, difficulty_level: "intermediate", priority: 2,
    description: "Deep-dive into React, Redux, React Router and server-side rendering with Next.js.",
    url: "https://www.udemy.com/course/the-ultimate-react-course/" },
  { skill_name: "React", title: "React Official Documentation",
    provider: "React Docs", resource_type: "doc", is_free: true,
    duration_hours: 3, difficulty_level: "beginner", priority: 1,
    description: "The official React docs with interactive examples and tutorials.",
    url: "https://react.dev/learn" },

  // Python
  { skill_name: "Python", title: "Python for Beginners - Full Crash Course",
    provider: "YouTube", resource_type: "video", is_free: true,
    duration_hours: 1, difficulty_level: "beginner", priority: 1,
    description: "Quick hands-on introduction to Python for absolute beginners.",
    url: "https://www.youtube.com/watch?v=khkuEVX5vLw" },
  { skill_name: "Python", title: "Python for Everybody",
    provider: "Coursera", resource_type: "course", is_free: true,
    duration_hours: 10, difficulty_level: "beginner", priority: 2,
    description: "University-level Python course covering data structures and web access.",
    url: "https://www.coursera.org/specializations/python" },
  { skill_name: "Python", title: "Official Python Tutorial",
    provider: "Python Docs", resource_type: "doc", is_free: true,
    duration_hours: 4, difficulty_level: "intermediate", priority: 2,
    description: "The official Python tutorial covering the full language specification.",
    url: "https://docs.python.org/3/tutorial/" },

  // SQL
  { skill_name: "SQL", title: "SQL Tutorial - Full Database Course for Beginners",
    provider: "freeCodeCamp", resource_type: "course", is_free: true,
    duration_hours: 4.3, difficulty_level: "beginner", priority: 1,
    description: "Complete SQL course covering SELECT, JOIN, aggregations and database design.",
    url: "https://www.youtube.com/watch?v=HXV3zeQKqW4" },
  { skill_name: "SQL", title: "SQLBolt — Interactive SQL Exercises",
    provider: "SQLBolt", resource_type: "course", is_free: true,
    duration_hours: 2, difficulty_level: "beginner", priority: 1,
    description: "Interactive browser-based SQL lessons with instant feedback.",
    url: "https://sqlbolt.com/" },

  // Docker
  { skill_name: "Docker", title: "Docker for Beginners: DevOps Fundamentals",
    provider: "YouTube", resource_type: "video", is_free: true,
    duration_hours: 1.9, difficulty_level: "beginner", priority: 1,
    description: "Learn Docker containers, images and basic DevOps workflows.",
    url: "https://www.youtube.com/watch?v=pTFZFxd4hOI" },
  { skill_name: "Docker", title: "Docker Official Get Started Guide",
    provider: "Docker Docs", resource_type: "doc", is_free: true,
    duration_hours: 1, difficulty_level: "beginner", priority: 1,
    description: "Official Docker tutorial covering containers, images and compose.",
    url: "https://docs.docker.com/get-started/" },

  // Figma
  { skill_name: "Figma", title: "Figma UI/UX Design Essentials Course",
    provider: "Udemy", resource_type: "course", is_free: false,
    duration_hours: 10, difficulty_level: "beginner", priority: 2,
    description: "Learn Figma for UI/UX design — wireframes, prototypes and design systems.",
    url: "https://www.udemy.com/course/figma-uiux-masterclass/" },
  { skill_name: "Figma", title: "Figma Official Learning Resources",
    provider: "Figma", resource_type: "doc", is_free: true,
    duration_hours: 2, difficulty_level: "beginner", priority: 1,
    description: "Official Figma guides covering all core features and design workflows.",
    url: "https://www.figma.com/resources/learn-design/" },

  // Node.js
  { skill_name: "Node.js", title: "Node.js Full Course - freeCodeCamp",
    provider: "freeCodeCamp", resource_type: "video", is_free: true,
    duration_hours: 3.1, difficulty_level: "beginner", priority: 1,
    description: "Full Node.js course covering Express, REST APIs, and async programming.",
    url: "https://www.youtube.com/watch?v=Oe421EPjeBE" },
  { skill_name: "Node.js", title: "Node.js Official Documentation",
    provider: "Node.js Docs", resource_type: "doc", is_free: true,
    duration_hours: 2, difficulty_level: "intermediate", priority: 2,
    description: "Official Node.js docs covering APIs, modules and runtime environment.",
    url: "https://nodejs.org/en/docs/" },

  // TypeScript
  { skill_name: "TypeScript", title: "TypeScript Full Course - freeCodeCamp",
    provider: "freeCodeCamp", resource_type: "video", is_free: true,
    duration_hours: 3.1, difficulty_level: "beginner", priority: 1,
    description: "Learn TypeScript from basics to advanced types and generics.",
    url: "https://www.youtube.com/watch?v=30LWjhZzg50" },
  { skill_name: "TypeScript", title: "TypeScript Official Handbook",
    provider: "TypeScript Docs", resource_type: "doc", is_free: true,
    duration_hours: 2, difficulty_level: "intermediate", priority: 2,
    description: "The official TypeScript handbook — types, interfaces, generics and more.",
    url: "https://www.typescriptlang.org/docs/handbook/intro.html" },

  // Git
  { skill_name: "Git", title: "Git & GitHub Crash Course",
    provider: "freeCodeCamp", resource_type: "video", is_free: true,
    duration_hours: 1.1, difficulty_level: "beginner", priority: 1,
    description: "Git and GitHub fundamentals — commits, branches, pull requests and workflows.",
    url: "https://www.youtube.com/watch?v=RGOj5yH7evk" },

  // CSS
  { skill_name: "CSS", title: "CSS Full Course - freeCodeCamp",
    provider: "freeCodeCamp", resource_type: "video", is_free: true,
    duration_hours: 6, difficulty_level: "beginner", priority: 1,
    description: "Complete CSS course covering selectors, flexbox, grid and animations.",
    url: "https://www.youtube.com/watch?v=OXGznpKZ_sA" },
  { skill_name: "CSS", title: "MDN CSS Reference",
    provider: "MDN", resource_type: "article", is_free: true,
    duration_hours: 3, difficulty_level: "intermediate", priority: 2,
    description: "Comprehensive MDN reference for all CSS properties and concepts.",
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS" },

  // PostgreSQL
  { skill_name: "PostgreSQL", title: "Learn PostgreSQL - freeCodeCamp",
    provider: "freeCodeCamp", resource_type: "video", is_free: true,
    duration_hours: 4.3, difficulty_level: "beginner", priority: 1,
    description: "Full PostgreSQL tutorial covering tables, queries, joins and indexing.",
    url: "https://www.youtube.com/watch?v=qw--VYLpxG4" },

  // Java
  { skill_name: "Java", title: "Java Full Course for Beginners - freeCodeCamp",
    provider: "freeCodeCamp", resource_type: "video", is_free: true,
    duration_hours: 9.6, difficulty_level: "beginner", priority: 1,
    description: "Complete Java course covering OOP, data structures and algorithms.",
    url: "https://www.youtube.com/watch?v=grEKMHGYyns" },

  // MongoDB
  { skill_name: "MongoDB", title: "MongoDB Crash Course",
    provider: "YouTube", resource_type: "video", is_free: true,
    duration_hours: 1.3, difficulty_level: "beginner", priority: 1,
    description: "Quick MongoDB intro covering documents, collections, CRUD and aggregation.",
    url: "https://www.youtube.com/watch?v=-bt_y4Loofg" },
  { skill_name: "MongoDB", title: "MongoDB Official Documentation",
    provider: "MongoDB Docs", resource_type: "doc", is_free: true,
    duration_hours: 3, difficulty_level: "intermediate", priority: 2,
    description: "Official MongoDB docs covering all features from basics to advanced.",
    url: "https://www.mongodb.com/docs/" },

  // AWS
  { skill_name: "AWS", title: "AWS Certified Cloud Practitioner - Full Course",
    provider: "freeCodeCamp", resource_type: "course", is_free: true,
    duration_hours: 13.9, difficulty_level: "beginner", priority: 1,
    description: "Complete AWS Cloud Practitioner prep covering core AWS services.",
    url: "https://www.youtube.com/watch?v=SOTamWNgDKc" },

  // Linux
  { skill_name: "Linux", title: "Linux Command Line Full Course",
    provider: "freeCodeCamp", resource_type: "course", is_free: true,
    duration_hours: 5.3, difficulty_level: "beginner", priority: 1,
    description: "Learn Linux terminal commands, file system, permissions and shell scripting.",
    url: "https://www.youtube.com/watch?v=sWbUDq4S6Y8" },

  // Tailwind CSS
  { skill_name: "Tailwind CSS", title: "Tailwind CSS Full Course",
    provider: "YouTube", resource_type: "video", is_free: true,
    duration_hours: 4, difficulty_level: "beginner", priority: 1,
    description: "Learn utility-first CSS with Tailwind — layouts, components and responsive design.",
    url: "https://www.youtube.com/watch?v=ft30zcMlFao" },

  // GraphQL
  { skill_name: "GraphQL", title: "GraphQL Full Course - Novice to Expert",
    provider: "freeCodeCamp", resource_type: "course", is_free: true,
    duration_hours: 4, difficulty_level: "intermediate", priority: 1,
    description: "Learn GraphQL from zero — queries, mutations, subscriptions and resolvers.",
    url: "https://www.youtube.com/watch?v=ed8SzALpx1Q" },

  // Machine Learning
  { skill_name: "Machine Learning", title: "Machine Learning Crash Course - Google",
    provider: "Google", resource_type: "course", is_free: true,
    duration_hours: 15, difficulty_level: "intermediate", priority: 1,
    description: "Google's fast-paced intro to ML — linear models, neural networks and more.",
    url: "https://developers.google.com/machine-learning/crash-course" },

  // CI/CD
  { skill_name: "CI/CD", title: "GitHub Actions Full Course",
    provider: "freeCodeCamp", resource_type: "course", is_free: true,
    duration_hours: 4, difficulty_level: "intermediate", priority: 1,
    description: "Learn CI/CD pipelines with GitHub Actions — automate testing and deployment.",
    url: "https://www.youtube.com/watch?v=R8_veQiYBjI" },

  // Vue
  { skill_name: "Vue", title: "Vue.js Full Course for Beginners",
    provider: "freeCodeCamp", resource_type: "course", is_free: true,
    duration_hours: 3.9, difficulty_level: "beginner", priority: 1,
    description: "Learn Vue 3 from scratch — components, directives, routing and Pinia.",
    url: "https://www.youtube.com/watch?v=VeNfHj6MhgA" },
];
