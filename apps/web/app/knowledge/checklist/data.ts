export type ChecklistItem = {
    id: string;
    title: string;
    description: string;
    type: "task" | "upload" | "info";
    whyItMatters: string;
    timeEstimate: string;
    typicalDocuments?: string[];
    actionLabel?: string;
};

export type ChecklistSection = {
    id: string;
    title: string;
    items: ChecklistItem[];
};

export type ChecklistPath = {
    id: string;
    label: string;
    description: string;
    sections: ChecklistSection[];
};

export const CHECKLIST_PATHS: Record<string, ChecklistPath> = {
    work: {
        id: "work",
        label: "Work Visa",
        description: "For professionals seeking employment abroad (e.g., H1B, Blue Card).",
        sections: [
            {
                id: "prep",
                title: "1. Preparation",
                items: [
                    {
                        id: "passport",
                        title: "Check Passport Validity",
                        description: "Ensure your passport is valid for at least 6 months beyond your intended stay.",
                        type: "upload",
                        whyItMatters: "Most countries will deny entry if your passport expires soon.",
                        timeEstimate: "1 day (or 4-6 weeks for renewal)",
                        typicalDocuments: ["Passport Bio Page"],
                        actionLabel: "Upload Passport"
                    },
                    {
                        id: "job_offer",
                        title: "Secure Job Offer",
                        description: "Obtain a formal job offer or contract from a sponsoring employer.",
                        type: "upload",
                        whyItMatters: "The primary requirement for work visas is a sponsoring entity.",
                        timeEstimate: "1-3 months",
                        typicalDocuments: ["Employment Contract", "Offer Letter"],
                        actionLabel: "Upload Job Offer"
                    }
                ]
            },
            {
                id: "apply",
                title: "2. Application",
                items: [
                    {
                        id: "petition",
                        title: "Employer Files Petition",
                        description: "Your employer must often file a petition (e.g., I-129 for US) before you apply.",
                        type: "task",
                        whyItMatters: "This approval notice is the foundation of your personal application.",
                        timeEstimate: "2-6 months",
                        typicalDocuments: ["Petition Approval Notice (I-797)"],
                        actionLabel: "Track Petition Status"
                    },
                    {
                        id: "ds160",
                        title: "Submit Visa Application",
                        description: "Complete the online visa application form (e.g., DS-160).",
                        type: "task",
                        whyItMatters: "Initiates your personal background check and interview scheduling.",
                        timeEstimate: "3-5 hours",
                        actionLabel: "Complete Application"
                    }
                ]
            }
        ]
    },
    study: {
        id: "study",
        label: "Student Visa",
        description: "For students accepted into university programs (e.g., F1, Tier 4).",
        sections: [
            {
                id: "acceptance",
                title: "1. Admission",
                items: [
                    {
                        id: "admit_letter",
                        title: "Receive Acceptance Letter",
                        description: "Get the official admission letter from your university.",
                        type: "upload",
                        whyItMatters: "Proof of valid study intent.",
                        timeEstimate: "Varies",
                        typicalDocuments: ["Acceptance Letter", "I-20 Form"],
                        actionLabel: "Upload Acceptance"
                    }
                ]
            }
        ]
    },
    nomad: {
        id: "nomad",
        label: "Digital Nomad",
        description: "For remote workers wanting to live in another country temporarily.",
        sections: [
            {
                id: "income",
                title: "1. Income Verification",
                items: [
                    {
                        id: "bank_statements",
                        title: "Gather Bank Statements",
                        description: "Prove you meet the monthly income requirement (varies by country).",
                        type: "upload",
                        whyItMatters: "Nomad visas are based on financial self-sufficiency.",
                        timeEstimate: "1 week",
                        typicalDocuments: ["3-6 Months Bank Statements"],
                        actionLabel: "Upload Statements"
                    }
                ]
            }
        ]
    }
};
