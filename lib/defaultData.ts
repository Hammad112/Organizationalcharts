import type { OrgData, OrgNode } from "./types";

const RED = "#990011";
const MAROON = "#5C000A";
const NAVY = "#2F3C7E";
const GOLD = "#C9A227";
const GREEN = "#0F6E56";

function emp(
  id: string,
  title: string,
  fields: {
    subtitle?: string;
    empCode?: string;
    designation?: string;
    department?: string;
    location?: string;
    dateOfJoining?: string;
    reportsTo?: string;
    description?: string;
    jobDescription?: string;
    requiredSkills?: string[];
    color?: string;
    children?: OrgNode[];
  }
): OrgNode {
  return {
    id,
    title,
    subtitle: fields.subtitle ?? fields.designation ?? "",
    empCode: fields.empCode,
    designation: fields.designation,
    department: fields.department,
    location: fields.location,
    dateOfJoining: fields.dateOfJoining,
    reportsTo: fields.reportsTo,
    description: fields.description,
    jobDescription: fields.jobDescription,
    requiredSkills: fields.requiredSkills,
    color: fields.color ?? RED,
    children: fields.children ?? [],
  };
}

export const defaultData: OrgData = {
  views: [
    {
      id: "overview",
      label: "Overview",
      icon: "network",
      auto: true,
      roots: [],
    },
    {
      id: "it-department",
      label: "IT",
      icon: "network",
      roots: [
        emp("taimoor", "Taimoor Khan Jadoon", {
          empCode: "1647",
          designation: "System Support Manager",
          department: "Business Organization and Development",
          location: "Islamabad",
          dateOfJoining: "01-Jul-22",
          reportsTo: "Islam Ahmed Khan",
          description:
            "System Support Manager heading IT operations across Karachi and Islamabad offices. Reports directly to Islam Ahmed Khan.",
          color: RED,
          children: [
            {
              id: "karachi-team",
              title: "Karachi Team",
              subtitle: "4 members — IT Operations",
              department: "IT",
              location: "Karachi",
              description:
                "Karachi IT team: 2 Managers and 2 Support Engineers handling on-site IT operations, infrastructure, and support.",
              color: NAVY,
              children: [
                emp("syed-asif", "Syed Muhammad Asif", {
                  empCode: "1714",
                  designation: "Manager",
                  department: "IT",
                  location: "Karachi",
                  dateOfJoining: "01-Mar-23",
                  reportsTo: "Taimoor Khan Jadoon",
                  description:
                    "IT Manager at Karachi office. Oversees IT operations and infrastructure for Karachi region.",
                  color: NAVY,
                }),
                emp("bashir", "Bashir Ahmed", {
                  empCode: "1715",
                  designation: "Manager",
                  department: "IT",
                  location: "Karachi",
                  dateOfJoining: "01-Mar-23",
                  reportsTo: "Taimoor Khan Jadoon",
                  description:
                    "IT Manager at Karachi office. Handles systems management and IT operations.",
                  color: NAVY,
                }),
                emp("shah-hassaan", "Syed Shah Hassaan Ahmed", {
                  empCode: "1781",
                  designation: "Senior IT Support Engineer",
                  department: "IT",
                  location: "Karachi",
                  dateOfJoining: "10-Jul-24",
                  reportsTo: "Taimoor Khan Jadoon",
                  description:
                    "Senior IT Support Engineer leading support operations at Karachi office.",
                  color: NAVY,
                }),
                emp("kabeer", "Abdul Kabeer Yasir", {
                  empCode: "1777",
                  designation: "IT Support Engineer",
                  department: "IT",
                  location: "Karachi",
                  dateOfJoining: "13-Jun-24",
                  reportsTo: "Taimoor Khan Jadoon",
                  description:
                    "IT Support Engineer providing day-to-day technical support at Karachi office.",
                  color: NAVY,
                }),
              ],
            },
            {
              id: "islamabad-team",
              title: "Islamabad Team",
              subtitle: "3 members — Development & AI",
              department: "IT",
              location: "Islamabad",
              description:
                "Islamabad IT team: 2 Web Developers and 1 AI Engineer. The development and innovation hub.",
              color: GREEN,
              children: [
                emp("hajra", "Hajra Hanif", {
                  empCode: "1742",
                  designation: "Web Developer",
                  department: "IT",
                  location: "Islamabad",
                  dateOfJoining: "18-Sept-23",
                  reportsTo: "Taimoor Khan Jadoon",
                  description:
                    "Web Developer at Islamabad office. Front-end development and web applications.",
                  color: GREEN,
                }),
                emp("amna", "Amna Akhtar", {
                  empCode: "1880",
                  designation: "Web Developer",
                  department: "IT",
                  location: "Islamabad",
                  dateOfJoining: "10-Feb-26",
                  reportsTo: "Taimoor Khan Jadoon",
                  description:
                    "Web Developer at Islamabad office. Joined Feb 2026.",
                  color: GREEN,
                }),
                emp("hammad", "Hammad Nasir", {
                  empCode: "1899",
                  designation: "AI Engineer",
                  department: "IT",
                  location: "Islamabad",
                  dateOfJoining: "02-Jul-26",
                  reportsTo: "Taimoor Khan Jadoon",
                  description:
                    "AI Engineer at Islamabad office. Works on AI/ML solutions and automation.",
                  color: GREEN,
                }),
              ],
            },
          ],
        }),
      ],
    },
    {
      id: "interactive",
      label: "Interactive",
      icon: "globe",
      roots: [
        emp("nina", "Nina Kashif", {
          designation: "Supervisor",
          department: "Interactive",
          location: "Islamabad",
          reportsTo: "Taimoor Khan Jadoon",
          description:
            "Supervisor of the Interactive department. Oversees web development for interactive digital products.",
          color: MAROON,
          children: [
            emp("usman-malik", "Muhammad Usman Malik", {
              empCode: "1700",
              designation: "Web Developer",
              department: "Interactive",
              location: "Islamabad",
              dateOfJoining: "16-Jan-23",
              reportsTo: "Nina Kashif",
              description:
                "Web Developer in the Interactive department. Builds interactive web experiences.",
              color: MAROON,
            }),
          ],
        }),
      ],
    },
    {
      id: "it-news",
      label: "IT — News",
      icon: "cpu",
      roots: [
        emp("itn-muddassir", "Muddassir Shafique", {
          empCode: "600972",
          designation: "Manager IT",
          department: "IT - News",
          location: "Islamabad",
          dateOfJoining: "14-Mar-23",
          reportsTo: "Taimoor Khan Jadoon",
          description:
            "Manager IT for HUM News department. Manages the IT-News team across Lahore and Islamabad offices.",
          color: GOLD,
          children: [
            emp("itn-asif", "Muhammad Asif", {
              empCode: "600825",
              designation: "Sr. IT Engineer",
              department: "IT - News",
              location: "Lahore",
              dateOfJoining: "01-Oct-20",
              reportsTo: "Muddassir Shafique",
              description:
                "Most senior member in IT-News team. Based at Lahore office since Oct 2020. Handles IT infrastructure for HUM News Lahore.",
              color: GOLD,
            }),
            emp("itn-sohail", "Sohail Zaib", {
              empCode: "601078",
              designation: "Sr. IT Engineer",
              department: "IT - News",
              location: "Islamabad",
              dateOfJoining: "25-Sept-23",
              reportsTo: "Muddassir Shafique",
              description:
                "Senior IT Engineer for HUM News. Handles broadcast systems and IT infrastructure at Islamabad.",
              color: GOLD,
            }),
            emp("itn-wajid", "Wajid Akhtar", {
              empCode: "601001",
              designation: "IT Engineer",
              department: "IT - News",
              location: "Islamabad",
              dateOfJoining: "02-May-23",
              reportsTo: "Muddassir Shafique",
              description:
                "IT Engineer for HUM News operations at Islamabad.",
              color: GOLD,
            }),
            emp("itn-usman", "Muhammad Usman", {
              empCode: "601092",
              designation: "IT Engineer",
              department: "IT - News",
              location: "Islamabad",
              dateOfJoining: "27-Nov-23",
              reportsTo: "Muddassir Shafique",
              description:
                "IT Engineer for HUM News Islamabad. Day-to-day IT support for news operations.",
              color: GOLD,
            }),
            emp("itn-hamza", "Muhammad Hamza", {
              empCode: "601221",
              designation: "IT Engineer",
              department: "IT - News",
              location: "Islamabad",
              dateOfJoining: "05-Dec-25",
              reportsTo: "Muddassir Shafique",
              description:
                "IT Engineer for HUM News. Joined Dec 2025.",
              color: GOLD,
            }),
          ],
        }),
      ],
    },
    {
      id: "ai-lab",
      label: "AI Lab",
      icon: "cpu",
      roots: [
        emp("ai-architect", "Senior AI Architect", {
          designation: "Senior AI Architect",
          department: "AI Lab",
          location: "Islamabad",
          reportsTo: "Taimoor Khan Jadoon",
          description:
            "Senior AI Architect leading the AI Lab. Oversees all AI/ML research, development, and deployment initiatives.",
          jobDescription:
            "• Owns end-to-end system architecture: defines services, data flow, model topology and interfaces; decomposes each product into independent, parallelizable work chunks\n• Designs the agentic AI framework — tool-calling, orchestration & guardrails — that every engineer builds their domain agents on\n• Sets the AI strategy — choosing the right models and approach for each job, balancing performance against cost\n• Defines engineering standards — code review, branching/Git strategy, CI/CD gates, secure-SDLC, test coverage and QA acceptance criteria\n• Owns the cloud infrastructure the AI systems run on — keeping it reliable, secure and easy to monitor\n• Runs sprint planning and technical estimation; single point of accountability for security, reliability and what ships to production",
          requiredSkills: [
            "5+ years software engineering",
            "AI/LLM-powered products",
            "System architecture",
            "Team leadership",
            "Stakeholder communication",
          ],
          color: "#7C3AED",
          children: [
            emp("hammad-ai", "Hammad Nasir", {
              empCode: "1899",
              designation: "AI Engineer",
              department: "AI Lab",
              location: "Islamabad",
              dateOfJoining: "02-Jul-26",
              reportsTo: "Senior AI Architect",
              description:
                "AI Engineer at AI Lab. Works on AI/ML solutions, automation, and intelligent systems.",
              color: "#7C3AED",
            }),
            emp("ai-junior-2", "Junior AI Engineer", {
              designation: "Junior AI Engineer",
              department: "AI Lab",
              location: "Islamabad",
              reportsTo: "Senior AI Architect",
              description: "Junior AI Engineer working on data pipelines, dashboards, and AI-driven analysis.",
              jobDescription:
                "• Designs and maintains ETL/ELT pipelines, data warehouse schemas and vector stores feeding every product\n• Builds live dashboards and automated reporting (BI tools / custom web) with scheduled refresh and alerting\n• Runs AI-driven analysis on content, audience and social data — spotting patterns, trends and sentiment automatically\n• Builds agentic workflows for content analysis & generation — agents that watch feeds, tag content and trigger insights automatically\n• Owns data quality, validation, lineage and access control; exposes clean datasets via APIs to the rest of the team\n• Instruments products with event analytics and defines the metrics that prove ROI",
              requiredSkills: [
                "Python",
                "SQL",
                "Dashboard / report building",
                "APIs and Git",
                "Willingness to learn AI tools",
              ],
              color: "#7C3AED",
            }),
            emp("ai-junior-3", "Junior AI Engineer", {
              designation: "Junior AI Engineer",
              department: "AI Lab",
              location: "Islamabad",
              reportsTo: "Senior AI Architect",
              description: "Junior AI Engineer focused on AI integration, QA, and testing pipelines.",
              jobDescription:
                "• Integrates models into websites, apps, CMS and internal systems; owns prompt & inference tuning and RAG pipelines\n• Builds agentic workflows into products — connecting agents to app actions, APIs and tools so software self-serves user tasks\n• Owns QA & QC — writes functional, integration, regression and end-to-end test suites; automates them in the pipeline\n• Wires APIs, webhooks and system hooks connecting AI to every HUM product and third-party service\n• Manages the release / CI-CD flow, environment promotion and versioning with the backend engineer\n• Monitors integrations in production — logging, alerting, error budgets — and drives fixes to closure",
              requiredSkills: [
                "JavaScript/TypeScript",
                "React",
                "QA and testing practices",
                "APIs and Git",
                "AI tools and prompt-based workflows",
              ],
              color: "#7C3AED",
            }),
            emp("ai-junior-4", "Junior AI Engineer", {
              designation: "Junior AI Engineer",
              department: "AI Lab",
              location: "Islamabad",
              reportsTo: "Senior AI Architect",
              description: "Junior AI Engineer handling backend services, model fine-tuning, and deployment.",
              jobDescription:
                "• Fine-tunes and improves AI models on HUM's Urdu audio and content, testing each change carefully before it ships\n• Builds backend services & APIs (REST/gRPC) that serve models to ERP, HRMS, CRM and agentic workflows\n• Builds agentic workflows across enterprise systems — agents that automate ERP/HRMS/CRM process flows end-to-end with human checkpoints\n• Develops frontend interfaces for internal tools and product surfaces where AI features live\n• Owns application security — keeping logins, data handling and dependencies safe and up to date\n• Owns deployment — packaging, releasing and safely rolling out updates to AI models and services",
              requiredSkills: [
                "Python",
                "Backend development (FastAPI/Node)",
                "Machine learning / AI models",
                "Security-conscious coding",
                "Basic frontend skills",
              ],
              color: "#7C3AED",
            }),
          ],
        }),
      ],
    },
  ],
};
