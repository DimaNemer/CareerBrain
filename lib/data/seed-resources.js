// lib/data/seed-resources.js
// skill_name values MUST match the DEFAULT_MASTER_SKILLS list in embed-skills.js exactly
// — any name not in that list will never appear in missing_skills, so its
//   resources will never surface in the gap roadmap.

export const seedResources = [

  // ── React ─────────────────────────────────────────────────────────────────
  { skill_name: "React", title: "React JS Full Course for Beginners 2026", provider: "freeCodeCamp", resource_type: "course", is_free: true, duration_hours: 2, difficulty_level: "beginner", priority: 1, description: "Learn React from scratch — components, hooks, state management and more.", url: "https://www.youtube.com/watch?v=bMknfKXIFA8" },
  { skill_name: "React", title: "The Ultimate React Course with Redux & Next.js", provider: "Udemy", resource_type: "course", is_free: false, duration_hours: 20, difficulty_level: "intermediate", priority: 2, description: "Deep-dive into React, Redux, React Router and server-side rendering with Next.js.", url: "https://www.udemy.com/course/the-ultimate-react-course/" },
  { skill_name: "React", title: "React Official Documentation", provider: "React Docs", resource_type: "doc", is_free: true, duration_hours: 3, difficulty_level: "beginner", priority: 1, description: "The official React docs with interactive examples and tutorials.", url: "https://react.dev/learn" },

  // ── JavaScript ────────────────────────────────────────────────────────────
  { skill_name: "JavaScript", title: "JavaScript Full Course for Beginners", provider: "freeCodeCamp", resource_type: "course", is_free: true, duration_hours: 7, difficulty_level: "beginner", priority: 1, description: "Complete JavaScript course covering ES6+, DOM manipulation, async/await and more.", url: "https://www.youtube.com/watch?v=PkZNo7MFNFg" },
  { skill_name: "JavaScript", title: "The Modern JavaScript Tutorial", provider: "javascript.info", resource_type: "doc", is_free: true, duration_hours: 10, difficulty_level: "intermediate", priority: 1, description: "Comprehensive modern JavaScript guide from basics to advanced topics.", url: "https://javascript.info/" },

  // ── Node.js ───────────────────────────────────────────────────────────────
  { skill_name: "Node.js", title: "Node.js Full Course - freeCodeCamp", provider: "freeCodeCamp", resource_type: "video", is_free: true, duration_hours: 3.1, difficulty_level: "beginner", priority: 1, description: "Full Node.js course covering Express, REST APIs, and async programming.", url: "https://www.youtube.com/watch?v=Oe421EPjeBE" },
  { skill_name: "Node.js", title: "Node.js Official Documentation", provider: "Node.js Docs", resource_type: "doc", is_free: true, duration_hours: 2, difficulty_level: "intermediate", priority: 2, description: "Official Node.js docs covering APIs, modules and runtime environment.", url: "https://nodejs.org/en/docs/" },

  // ── Python ────────────────────────────────────────────────────────────────
  { skill_name: "Python", title: "Python for Beginners - Full Crash Course", provider: "YouTube", resource_type: "video", is_free: true, duration_hours: 1, difficulty_level: "beginner", priority: 1, description: "Quick hands-on introduction to Python for absolute beginners.", url: "https://www.youtube.com/watch?v=khkuEVX5vLw" },
  { skill_name: "Python", title: "Python for Everybody", provider: "Coursera", resource_type: "course", is_free: true, duration_hours: 10, difficulty_level: "beginner", priority: 2, description: "University-level Python course covering data structures and web access.", url: "https://www.coursera.org/specializations/python" },
  { skill_name: "Python", title: "Official Python Tutorial", provider: "Python Docs", resource_type: "doc", is_free: true, duration_hours: 4, difficulty_level: "intermediate", priority: 2, description: "The official Python tutorial covering the full language specification.", url: "https://docs.python.org/3/tutorial/" },

  // ── TypeScript ────────────────────────────────────────────────────────────
  { skill_name: "TypeScript", title: "TypeScript Full Course - freeCodeCamp", provider: "freeCodeCamp", resource_type: "video", is_free: true, duration_hours: 3.1, difficulty_level: "beginner", priority: 1, description: "Learn TypeScript from basics to advanced types and generics.", url: "https://www.youtube.com/watch?v=30LWjhZzg50" },
  { skill_name: "TypeScript", title: "TypeScript Official Handbook", provider: "TypeScript Docs", resource_type: "doc", is_free: true, duration_hours: 2, difficulty_level: "intermediate", priority: 2, description: "The official TypeScript handbook — types, interfaces, generics and more.", url: "https://www.typescriptlang.org/docs/handbook/intro.html" },

  // ── SQL ───────────────────────────────────────────────────────────────────
  { skill_name: "SQL", title: "SQL Tutorial - Full Database Course for Beginners", provider: "freeCodeCamp", resource_type: "course", is_free: true, duration_hours: 4.3, difficulty_level: "beginner", priority: 1, description: "Complete SQL course covering SELECT, JOIN, aggregations and database design.", url: "https://www.youtube.com/watch?v=HXV3zeQKqW4" },
  { skill_name: "SQL", title: "SQLBolt — Interactive SQL Exercises", provider: "SQLBolt", resource_type: "course", is_free: true, duration_hours: 2, difficulty_level: "beginner", priority: 1, description: "Interactive browser-based SQL lessons with instant feedback.", url: "https://sqlbolt.com/" },

  // ── AWS ───────────────────────────────────────────────────────────────────
  { skill_name: "AWS", title: "AWS Certified Cloud Practitioner - Full Course", provider: "freeCodeCamp", resource_type: "course", is_free: true, duration_hours: 13.9, difficulty_level: "beginner", priority: 1, description: "Complete AWS Cloud Practitioner prep covering core AWS services.", url: "https://www.youtube.com/watch?v=SOTamWNgDKc" },
  { skill_name: "AWS", title: "AWS Official Getting Started", provider: "AWS Docs", resource_type: "doc", is_free: true, duration_hours: 2, difficulty_level: "beginner", priority: 2, description: "Official AWS getting started guides and tutorials.", url: "https://aws.amazon.com/getting-started/" },

  // ── Docker ────────────────────────────────────────────────────────────────
  { skill_name: "Docker", title: "Docker for Beginners: DevOps Fundamentals", provider: "YouTube", resource_type: "video", is_free: true, duration_hours: 1.9, difficulty_level: "beginner", priority: 1, description: "Learn Docker containers, images and basic DevOps workflows.", url: "https://www.youtube.com/watch?v=pTFZFxd4hOI" },
  { skill_name: "Docker", title: "Docker Official Get Started Guide", provider: "Docker Docs", resource_type: "doc", is_free: true, duration_hours: 1, difficulty_level: "beginner", priority: 1, description: "Official Docker tutorial covering containers, images and compose.", url: "https://docs.docker.com/get-started/" },

  // ── HTML ──────────────────────────────────────────────────────────────────
  { skill_name: "HTML", title: "HTML Full Course - freeCodeCamp", provider: "freeCodeCamp", resource_type: "course", is_free: true, duration_hours: 2, difficulty_level: "beginner", priority: 1, description: "Complete HTML course from structure and semantics to forms and accessibility.", url: "https://www.youtube.com/watch?v=kUMe1FH4CHE" },
  { skill_name: "HTML", title: "MDN HTML Guide", provider: "MDN", resource_type: "doc", is_free: true, duration_hours: 3, difficulty_level: "beginner", priority: 1, description: "Comprehensive MDN guide covering all HTML elements and best practices.", url: "https://developer.mozilla.org/en-US/docs/Web/HTML" },

  // ── CSS ───────────────────────────────────────────────────────────────────
  { skill_name: "CSS", title: "CSS Full Course - freeCodeCamp", provider: "freeCodeCamp", resource_type: "video", is_free: true, duration_hours: 6, difficulty_level: "beginner", priority: 1, description: "Complete CSS course covering selectors, flexbox, grid and animations.", url: "https://www.youtube.com/watch?v=OXGznpKZ_sA" },
  { skill_name: "CSS", title: "MDN CSS Reference", provider: "MDN", resource_type: "article", is_free: true, duration_hours: 3, difficulty_level: "intermediate", priority: 2, description: "Comprehensive MDN reference for all CSS properties and concepts.", url: "https://developer.mozilla.org/en-US/docs/Web/CSS" },

  // ── DevOps ────────────────────────────────────────────────────────────────
  { skill_name: "DevOps", title: "DevOps Engineering Course - freeCodeCamp", provider: "freeCodeCamp", resource_type: "course", is_free: true, duration_hours: 6, difficulty_level: "intermediate", priority: 1, description: "Learn DevOps practices, tools and culture for modern software delivery.", url: "https://www.youtube.com/watch?v=j5Zsa_eOXeY" },
  { skill_name: "DevOps", title: "DevOps Roadmap", provider: "roadmap.sh", resource_type: "doc", is_free: true, duration_hours: 2, difficulty_level: "beginner", priority: 1, description: "Step-by-step roadmap to becoming a DevOps engineer.", url: "https://roadmap.sh/devops" },

  // ── Kubernetes ────────────────────────────────────────────────────────────
  { skill_name: "Kubernetes", title: "Kubernetes Full Course - freeCodeCamp", provider: "freeCodeCamp", resource_type: "course", is_free: true, duration_hours: 4, difficulty_level: "intermediate", priority: 1, description: "Learn Kubernetes from scratch — pods, deployments, services and scaling.", url: "https://www.youtube.com/watch?v=X48VuDVv0do" },
  { skill_name: "Kubernetes", title: "Kubernetes Official Documentation", provider: "Kubernetes Docs", resource_type: "doc", is_free: true, duration_hours: 3, difficulty_level: "intermediate", priority: 2, description: "Official Kubernetes docs covering all core concepts.", url: "https://kubernetes.io/docs/home/" },

  // ── GraphQL ───────────────────────────────────────────────────────────────
  { skill_name: "GraphQL", title: "GraphQL Full Course - Novice to Expert", provider: "freeCodeCamp", resource_type: "course", is_free: true, duration_hours: 4, difficulty_level: "intermediate", priority: 1, description: "Learn GraphQL from zero — queries, mutations, subscriptions and resolvers.", url: "https://www.youtube.com/watch?v=ed8SzALpx1Q" },
  { skill_name: "GraphQL", title: "GraphQL Official Documentation", provider: "GraphQL Docs", resource_type: "doc", is_free: true, duration_hours: 2, difficulty_level: "beginner", priority: 1, description: "Official GraphQL documentation with tutorials and best practices.", url: "https://graphql.org/learn/" },

  // ── API Development ───────────────────────────────────────────────────────
  { skill_name: "API Development", title: "APIs for Beginners - freeCodeCamp", provider: "freeCodeCamp", resource_type: "course", is_free: true, duration_hours: 2, difficulty_level: "beginner", priority: 1, description: "Learn what APIs are, how they work, and how to build them.", url: "https://www.youtube.com/watch?v=GZvSYJDk-us" },
  { skill_name: "API Development", title: "REST API Design Best Practices", provider: "freeCodeCamp", resource_type: "article", is_free: true, duration_hours: 0.5, difficulty_level: "intermediate", priority: 2, description: "Best practices for designing clean, scalable REST APIs.", url: "https://www.freecodecamp.org/news/rest-api-design-best-practices-build-a-rest-api/" },

  // ── CI/CD ─────────────────────────────────────────────────────────────────
  { skill_name: "CI/CD", title: "GitHub Actions Full Course", provider: "freeCodeCamp", resource_type: "course", is_free: true, duration_hours: 4, difficulty_level: "intermediate", priority: 1, description: "Learn CI/CD pipelines with GitHub Actions — automate testing and deployment.", url: "https://www.youtube.com/watch?v=R8_veQiYBjI" },
  { skill_name: "CI/CD", title: "CI/CD Concepts - Atlassian", provider: "Atlassian", resource_type: "article", is_free: true, duration_hours: 0.5, difficulty_level: "beginner", priority: 2, description: "Clear explanation of CI/CD concepts, benefits and tools.", url: "https://www.atlassian.com/continuous-delivery/ci-vs-ci-vs-cd" },

  // ── Go ────────────────────────────────────────────────────────────────────
  { skill_name: "Go", title: "Go Programming Language - Full Course", provider: "freeCodeCamp", resource_type: "course", is_free: true, duration_hours: 7, difficulty_level: "beginner", priority: 1, description: "Learn Go from scratch — syntax, concurrency, and building real programs.", url: "https://www.youtube.com/watch?v=un6ZyFkqFKo" },
  { skill_name: "Go", title: "Go Official Tour", provider: "Go Docs", resource_type: "doc", is_free: true, duration_hours: 2, difficulty_level: "beginner", priority: 1, description: "Interactive tour of the Go programming language.", url: "https://go.dev/tour/" },

  // ── Data Science ──────────────────────────────────────────────────────────
  { skill_name: "Data Science", title: "Data Science Full Course - freeCodeCamp", provider: "freeCodeCamp", resource_type: "course", is_free: true, duration_hours: 12, difficulty_level: "beginner", priority: 1, description: "Complete data science course covering Python, statistics, ML and visualization.", url: "https://www.youtube.com/watch?v=ua-CiDNNj30" },
  { skill_name: "Data Science", title: "IBM Data Science Professional Certificate", provider: "Coursera", resource_type: "course", is_free: false, duration_hours: 60, difficulty_level: "beginner", priority: 2, description: "Professional data science certification from IBM covering real-world projects.", url: "https://www.coursera.org/professional-certificates/ibm-data-science" },

  // ── Product Management ────────────────────────────────────────────────────
  { skill_name: "Product Management", title: "Product Management Fundamentals", provider: "YouTube", resource_type: "video", is_free: true, duration_hours: 1.5, difficulty_level: "beginner", priority: 1, description: "Introduction to product management roles, responsibilities and skills.", url: "https://www.youtube.com/watch?v=cDIE0bFMqz8" },
  { skill_name: "Product Management", title: "Product School Blog", provider: "Product School", resource_type: "article", is_free: true, duration_hours: 1, difficulty_level: "beginner", priority: 2, description: "Expert articles on product management best practices and career advice.", url: "https://productschool.com/blog" },

  // ── Test Automation ───────────────────────────────────────────────────────
  { skill_name: "Test Automation", title: "Software Testing Full Course", provider: "freeCodeCamp", resource_type: "course", is_free: true, duration_hours: 3, difficulty_level: "beginner", priority: 1, description: "Learn software testing principles, tools and test automation frameworks.", url: "https://www.youtube.com/watch?v=sO8eGL6SFsA" },

  // ── Communication ─────────────────────────────────────────────────────────
  { skill_name: "Communication", title: "Business Communication Skills", provider: "Coursera", resource_type: "course", is_free: true, duration_hours: 5, difficulty_level: "beginner", priority: 1, description: "Develop professional communication skills for the workplace.", url: "https://www.coursera.org/learn/business-communication" },

  // ── Project Management ────────────────────────────────────────────────────
  { skill_name: "Project Management", title: "Google Project Management Certificate", provider: "Coursera", resource_type: "course", is_free: false, duration_hours: 40, difficulty_level: "beginner", priority: 1, description: "Professional project management certification from Google.", url: "https://www.coursera.org/professional-certificates/google-project-management" },
  { skill_name: "Project Management", title: "Project Management Basics", provider: "YouTube", resource_type: "video", is_free: true, duration_hours: 1, difficulty_level: "beginner", priority: 2, description: "Quick introduction to project management frameworks and tools.", url: "https://www.youtube.com/watch?v=9LSnINglkQA" },

  // ── Data Analysis ─────────────────────────────────────────────────────────
  { skill_name: "Data Analysis", title: "Data Analysis with Python - freeCodeCamp", provider: "freeCodeCamp", resource_type: "course", is_free: true, duration_hours: 3, difficulty_level: "beginner", priority: 1, description: "Learn data analysis using Python, Pandas and Matplotlib.", url: "https://www.youtube.com/watch?v=r-uOLxNrNk8" },

  // ── Marketing ─────────────────────────────────────────────────────────────
  { skill_name: "Marketing", title: "Google Digital Marketing Certificate", provider: "Coursera", resource_type: "course", is_free: false, duration_hours: 30, difficulty_level: "beginner", priority: 1, description: "Professional digital marketing certification from Google.", url: "https://www.coursera.org/professional-certificates/google-digital-marketing-ecommerce" },

  // ── Leadership ────────────────────────────────────────────────────────────
  { skill_name: "Leadership", title: "Leading Teams - Coursera", provider: "Coursera", resource_type: "course", is_free: true, duration_hours: 4, difficulty_level: "intermediate", priority: 1, description: "Learn to lead teams effectively — motivation, communication and decision making.", url: "https://www.coursera.org/learn/leading-teams" },

  // ── Research ──────────────────────────────────────────────────────────────
  { skill_name: "Research", title: "Research Methods - Full Course", provider: "YouTube", resource_type: "video", is_free: true, duration_hours: 2, difficulty_level: "beginner", priority: 1, description: "Introduction to research methods, design and analysis.", url: "https://www.youtube.com/watch?v=_X1jFOBQjZw" },

  // ── Sales ─────────────────────────────────────────────────────────────────
  { skill_name: "Sales", title: "Salesforce Sales Development Representative", provider: "Coursera", resource_type: "course", is_free: false, duration_hours: 20, difficulty_level: "beginner", priority: 1, description: "Professional sales certification covering prospecting, pitching and closing.", url: "https://www.coursera.org/professional-certificates/salesforce-sales-development-representative" },

  // ── Human Resources ───────────────────────────────────────────────────────
  { skill_name: "Human Resources", title: "Human Resource Management - Coursera", provider: "Coursera", resource_type: "course", is_free: true, duration_hours: 8, difficulty_level: "beginner", priority: 1, description: "Learn HR fundamentals — recruitment, performance management and labor law.", url: "https://www.coursera.org/learn/human-resource-management" },
];
