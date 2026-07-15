// BCBA Test Content Outline (6th ed.) — BACB, effective for exams beginning 2025.
// Source: "BCBA-6th-Edition-Test-Content-Outline-240903-a.pdf" (Updated 09/2024).
// https://www.bacb.com/wp-content/bcba-outline-6thEd/
//
// This is the authoritative content-domain taxonomy for BCBA fieldwork Task List
// Area tracking. A prior version of this app used a fabricated set of domain
// names for A-E (Measurement / Skill Acquisition / Behavior Reduction /
// Documentation & Reporting / Professional Conduct) that do not correspond to
// any real BACB document — only F-I happened to coincidentally match the real
// TCO. Do not edit domain names/task text without a source citation.

export type TcoTask = { num: number; text: string };
export type TcoDomain = { code: string; name: string; questionCount: number; tasks: TcoTask[] };

export const BCBA_TCO_6TH_ED: TcoDomain[] = [
  {
    code: 'A',
    name: 'Behaviorism and Philosophical Foundations',
    questionCount: 8,
    tasks: [
      { num: 1, text: 'Identify the goals of behavior analysis as a science (i.e., description, prediction, control).' },
      { num: 2, text: 'Explain the philosophical assumptions underlying the science of behavior analysis (e.g., selectionism, determinism, empiricism, parsimony, pragmatism).' },
      { num: 3, text: 'Explain behavior from the perspective of radical behaviorism.' },
      { num: 4, text: 'Distinguish among behaviorism, the experimental analysis of behavior, applied behavior analysis, and professional practice guided by the science of behavior analysis.' },
      { num: 5, text: 'Identify and describe dimensions of applied behavior analysis.' },
    ],
  },
  {
    code: 'B',
    name: 'Concepts and Principles',
    questionCount: 24,
    tasks: [
      { num: 1, text: 'Identify and distinguish among behavior, response, and response class.' },
      { num: 2, text: 'Identify and distinguish between stimulus and stimulus class.' },
      { num: 3, text: 'Identify and distinguish between respondent and operant conditioning.' },
      { num: 4, text: 'Identify and distinguish between positive and negative reinforcement contingencies.' },
      { num: 5, text: 'Identify and distinguish between positive and negative punishment contingencies.' },
      { num: 6, text: 'Identify and distinguish between automatic and socially mediated contingencies.' },
      { num: 7, text: 'Identify and distinguish among unconditioned, conditioned, and generalized reinforcers.' },
      { num: 8, text: 'Identify and distinguish among unconditioned, conditioned, and generalized punishers.' },
      { num: 9, text: 'Identify and distinguish among simple schedules of reinforcement.' },
      { num: 10, text: 'Identify and distinguish among concurrent, multiple, mixed, and chained schedules of reinforcement.' },
      { num: 11, text: 'Identify and distinguish between operant and respondent extinction as operations and processes.' },
      { num: 12, text: 'Identify examples of stimulus control.' },
      { num: 13, text: 'Identify examples of stimulus discrimination.' },
      { num: 14, text: 'Identify and distinguish between stimulus and response generalization.' },
      { num: 15, text: 'Identify examples of response maintenance.' },
      { num: 16, text: 'Identify examples of motivating operations.' },
      { num: 17, text: 'Distinguish between motivating operations and stimulus control.' },
      { num: 18, text: 'Identify and distinguish between rule-governed and contingency-shaped behavior.' },
      { num: 19, text: 'Identify and distinguish among verbal operants.' },
      { num: 20, text: 'Identify the role of multiple control in verbal behavior.' },
      { num: 21, text: 'Identify examples of processes that promote emergent relations and generative performance.' },
      { num: 22, text: 'Identify ways behavioral momentum can be used to understand response persistence.' },
      { num: 23, text: 'Identify ways the matching law can be used to interpret response allocation.' },
      { num: 24, text: 'Identify and distinguish between imitation and observational learning.' },
    ],
  },
  {
    code: 'C',
    name: 'Measurement, Data Display, and Interpretation',
    questionCount: 21,
    tasks: [
      { num: 1, text: 'Create operational definitions of behavior.' },
      { num: 2, text: 'Distinguish among direct, indirect, and product measures of behavior.' },
      { num: 3, text: 'Measure occurrence.' },
      { num: 4, text: 'Measure temporal dimensions of behavior (e.g., duration, latency, interresponse time).' },
      { num: 5, text: 'Distinguish between continuous and discontinuous measurement procedures.' },
      { num: 6, text: 'Design and apply discontinuous measurement procedures (e.g., interval recording, time sampling).' },
      { num: 7, text: 'Measure efficiency (e.g., trials to criterion, cost-benefit analysis, training duration).' },
      { num: 8, text: 'Evaluate the validity and reliability of measurement procedures.' },
      { num: 9, text: 'Select a measurement procedure to obtain representative data that accounts for the critical dimension of the behavior and environmental constraints.' },
      { num: 10, text: 'Graph data to communicate relevant quantitative relations (e.g., equal-interval graphs, bar graphs, cumulative records).' },
      { num: 11, text: 'Interpret graphed data.' },
      { num: 12, text: 'Select a measurement procedure to obtain representative procedural integrity data that accounts for relevant dimensions (e.g., accuracy, dosage) and environmental constraints.' },
    ],
  },
  {
    code: 'D',
    name: 'Experimental Design',
    questionCount: 13,
    tasks: [
      { num: 1, text: 'Distinguish between dependent and independent variables.' },
      { num: 2, text: 'Distinguish between internal and external validity.' },
      { num: 3, text: 'Identify threats to internal validity (e.g., history, maturation).' },
      { num: 4, text: 'Identify the defining features of single-case experimental designs (e.g., individuals serve as their own controls, repeated measures, prediction, verification, replication).' },
      { num: 5, text: 'Identify the relative strengths of single-case experimental designs and group designs.' },
      { num: 6, text: 'Critique and interpret data from single-case experimental designs.' },
      { num: 7, text: 'Distinguish among reversal, multiple-baseline, multielement, and changing-criterion designs.' },
      { num: 8, text: 'Identify rationales for conducting comparative, component, and parametric analyses.' },
      { num: 9, text: 'Apply single-case experimental designs.' },
    ],
  },
  {
    code: 'E',
    name: 'Ethical and Professional Issues',
    questionCount: 22,
    tasks: [
      { num: 1, text: 'Identify and apply core principles underlying the ethics codes for BACB certificants (e.g., benefit others; treat others with compassion, dignity, and respect; behave with integrity).' },
      { num: 2, text: 'Identify the risks to oneself, others, and the profession as a result of engaging in unethical behavior.' },
      { num: 3, text: 'Develop and maintain competence by engaging in professional development activities (e.g., read literature, seek consultation, establish mentors).' },
      { num: 4, text: 'Identify and comply with requirements for collecting, using, protecting, and disclosing confidential information.' },
      { num: 5, text: 'Identify and comply with requirements for making public statements about professional activities (e.g., social media activity; misrepresentation of professional credentials, behavior analysis, and service outcomes).' },
      { num: 6, text: 'Identify the conditions under which services or supervision should be discontinued and apply steps that should be taken when transitioning clients and supervisees to another professional.' },
      { num: 7, text: 'Identify types of and risks associated with multiple relationships, and how to mitigate those risks when they are unavoidable.' },
      { num: 8, text: 'Identify and apply interpersonal and other skills (e.g., accepting feedback, listening actively, seeking input, collaborating) to establish and maintain professional relationships.' },
      { num: 9, text: 'Engage in cultural humility in service delivery and professional relationships.' },
      { num: 10, text: 'Apply culturally responsive and inclusive service and supervision activities.' },
      { num: 11, text: 'Identify personal biases and how they might interfere with professional activity.' },
      { num: 12, text: 'Identify and apply the legal, regulatory, and practice requirements (e.g., licensure, jurisprudence, funding, certification) relevant to the delivery of behavior-analytic services.' },
    ],
  },
  {
    code: 'F',
    name: 'Behavior Assessment',
    questionCount: 23,
    tasks: [
      { num: 1, text: 'Identify relevant sources of information in records (e.g., educational, medical, historical) at the outset of the case.' },
      { num: 2, text: 'Identify and integrate relevant cultural variables in the assessment process.' },
      { num: 3, text: 'Design and evaluate assessments of relevant skill strengths and areas of need.' },
      { num: 4, text: 'Design and evaluate preference assessments.' },
      { num: 5, text: 'Design and evaluate descriptive assessments.' },
      { num: 6, text: 'Design and evaluate functional analyses.' },
      { num: 7, text: 'Interpret assessment data to determine the need for behavior-analytic services and/or referral to others.' },
      { num: 8, text: 'Interpret assessment data to identify and prioritize socially significant, client-informed, and culturally responsive behavior-change procedures and goals.' },
    ],
  },
  {
    code: 'G',
    name: 'Behavior-Change Procedures',
    questionCount: 25,
    tasks: [
      { num: 1, text: 'Design and evaluate positive and negative reinforcement procedures.' },
      { num: 2, text: 'Design and evaluate differential reinforcement (e.g., DRA, DRO, DRL, DRH) procedures with and without extinction.' },
      { num: 3, text: 'Design and evaluate time-based reinforcement (e.g., fixed-time) schedules.' },
      { num: 4, text: 'Identify procedures to establish and use conditioned reinforcers (e.g., token economies).' },
      { num: 5, text: 'Incorporate motivating operations and discriminative stimuli into behavior-change procedures.' },
      { num: 6, text: 'Design and evaluate procedures to produce simple and conditional discriminations.' },
      { num: 7, text: 'Select and evaluate stimulus and response prompting procedures (e.g., errorless, most-to-least, least-to-most).' },
      { num: 8, text: 'Design and implement procedures to fade stimulus and response prompts (e.g., prompt delay, stimulus fading).' },
      { num: 9, text: 'Design and evaluate modeling procedures.' },
      { num: 10, text: 'Design and evaluate instructions and rules.' },
      { num: 11, text: 'Shape dimensions of behavior.' },
      { num: 12, text: 'Select and implement chaining procedures.' },
      { num: 13, text: 'Design and evaluate trial-based and free-operant procedures.' },
      { num: 14, text: 'Design and evaluate group contingencies.' },
      { num: 15, text: 'Design and evaluate procedures to promote stimulus and response generalization.' },
      { num: 16, text: 'Design and evaluate procedures to maintain desired behavior change following intervention (e.g., schedule thinning, transferring to naturally occurring reinforcers).' },
      { num: 17, text: 'Design and evaluate positive and negative punishment (e.g., time-out, response cost, overcorrection).' },
      { num: 18, text: 'Evaluate emotional and elicited effects of behavior-change procedures.' },
      { num: 19, text: 'Design and evaluate procedures to promote emergent relations and generative performance.' },
    ],
  },
  {
    code: 'H',
    name: 'Selecting and Implementing Interventions',
    questionCount: 20,
    tasks: [
      { num: 1, text: 'Develop intervention goals in observable and measurable terms.' },
      { num: 2, text: 'Identify and recommend interventions based on assessment results, scientific evidence, client preferences, and contextual fit (e.g., expertise required for implementation, cultural variables, environmental resources).' },
      { num: 3, text: 'Select socially valid alternative behavior to be established or increased when a target behavior is to be decreased.' },
      { num: 4, text: 'Plan for and attempt to mitigate possible unwanted effects when using reinforcement, extinction, and punishment procedures.' },
      { num: 5, text: 'Plan for and attempt to mitigate possible relapse of the target behavior.' },
      { num: 6, text: 'Make data-based decisions about procedural integrity.' },
      { num: 7, text: 'Make data-based decisions about the effectiveness of the intervention and the need for modification.' },
      { num: 8, text: 'Collaborate with others to support and enhance client services.' },
    ],
  },
  {
    code: 'I',
    name: 'Personnel Supervision and Management',
    questionCount: 19,
    tasks: [
      { num: 1, text: 'Identify the benefits of using behavior-analytic supervision (e.g., improved client outcomes, improved staff performance and retention).' },
      { num: 2, text: 'Identify and apply strategies for establishing effective supervisory relationships (e.g., executing supervisor-supervisee contracts, establishing clear expectations, giving and accepting feedback).' },
      { num: 3, text: 'Identify and implement methods that promote equity in supervision practices.' },
      { num: 4, text: 'Select supervision goals based on an assessment of the supervisee\u2019s skills, cultural variables, and the environment.' },
      { num: 5, text: 'Identify and apply empirically validated and culturally responsive performance management procedures (e.g., modeling, practice, feedback, reinforcement, task clarification, manipulation of response effort).' },
      { num: 6, text: 'Apply a function-based approach (e.g., performance diagnostics) to assess and improve supervisee behavior.' },
      { num: 7, text: 'Make data-based decisions about the efficacy of supervisory practices.' },
    ],
  },
];

// Display strings for the domain dropdown, e.g. "A. Behaviorism and Philosophical Foundations"
export const BCBA_TCO_DOMAIN_LABELS: string[] = BCBA_TCO_6TH_ED.map((d) => `${d.code}. ${d.name}`);
