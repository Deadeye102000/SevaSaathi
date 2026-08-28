import fs from 'fs';
import path from 'path';

/**
 * Policy Retriever for SevaSaathi
 * Reads and searches policy documents located in the /content/policy directory.
 */

const POLICY_DIR = path.join(process.cwd(), 'content', 'policy');

/**
 * Reads a policy markdown file safely
 * @param {string} fileName - Name of the markdown file (e.g. 'leave-rules.md')
 * @returns {string} Raw markdown content
 */
export function getPolicyContent(fileName) {
  try {
    const filePath = path.join(POLICY_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return '';
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading policy document ${fileName}:`, error);
    return '';
  }
}

/**
 * Retrieves all available policy documents
 * @returns {Array<{ name: string, content: string }>}
 */
export function getAllPolicies() {
  const policyFiles = ['leave-rules.md', 'leave-process.md'];
  return policyFiles.map((file) => ({
    name: file,
    content: getPolicyContent(file),
  }));
}

/**
 * Searches policy documents for matching queries or keywords
 * @param {string} query - Search term or user inquiry
 * @returns {Array<{ source: string, snippet: string, score: number }>}
 */
export function searchPolicies(query = '') {
  if (!query || typeof query !== 'string') return [];

  const STOPWORDS = new Set([
    'what', 'is', 'the', 'a', 'an', 'for', 'of', 'in', 'and', 'or', 'to', 'can',
    'how', 'do', 'i', 'my', 'me', 'it', 'on', 'at', 'with', 'from', 'by', 'are'
  ]);
  const terms = query
    .toLowerCase()
    .split(/[^a-zA-Z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));

  if (terms.length === 0) return [];

  const policies = getAllPolicies();
  const matches = [];

  for (const policy of policies) {
    if (!policy.content || policy.content.trim().length === 0) {
      continue;
    }

    // Chunk by markdown sections (preserving headings with their content)
    const sections = policy.content.split(/\n(?=#{1,3}\s)/).map((s) => s.trim()).filter(Boolean);
    for (const section of sections) {
      const lower = section.toLowerCase();
      let matchCount = 0;
      for (const term of terms) {
        if (lower.includes(term)) {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          matchCount += regex.test(section) ? 2 : 1;
        }
      }

      if (matchCount > 0) {
        matches.push({
          source: policy.name,
          snippet: section,
          score: matchCount,
        });
      }
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

/**
 * Helper to extract a markdown section starting with '##' matching a keyword in its heading.
 * @param {string} content - Full markdown document content
 * @param {string} keyword - Keyword to match against the section heading
 * @returns {string|null} The matched section or null
 */
function extractSection(content, keyword) {
  if (!content || typeof content !== 'string') return null;
  const regex = new RegExp(`(^|\\n)(##\\s+[^\\n]*${keyword}[^\\n]*[\\s\\S]*?)(?=\\n##|$)`, 'i');
  const match = content.match(regex);
  return match ? match[2].trim() : null;
}

/**
 * Retrieves relevant policy content for a given user query.
 * - Reads markdown content from /content/policy/leave-rules.md and /content/policy/leave-process.md
 * - Does keyword matching: if query contains "casual", "earned", or "medical",
 *   extracts and returns only the matching ## section from leave-rules.md
 * - Always includes the full leave-process.md content
 * - Returns a single string combining the matched sections
 *
 * @param {string} query - The search query or user prompt
 * @returns {string} Single combined policy string
 */
export function getRelevantPolicy(query = '') {
  const rulesPath = path.join(POLICY_DIR, 'leave-rules.md');
  const processPath = path.join(POLICY_DIR, 'leave-process.md');

  const rulesContent = fs.existsSync(rulesPath) ? fs.readFileSync(rulesPath, 'utf-8') : '';
  const processContent = fs.existsSync(processPath) ? fs.readFileSync(processPath, 'utf-8').trim() : '';

  const lowerQuery = (typeof query === 'string' ? query : '').toLowerCase();
  const matchedSections = [];

  const keywords = ['casual', 'earned', 'medical'];
  for (const keyword of keywords) {
    if (lowerQuery.includes(keyword)) {
      const section = extractSection(rulesContent, keyword);
      if (section && !matchedSections.includes(section)) {
        matchedSections.push(section);
      }
    }
  }

  const parts = [];
  if (matchedSections.length > 0) {
    parts.push(matchedSections.join('\n\n'));
  }
  if (processContent) {
    parts.push(processContent);
  }

  return parts.join('\n\n');
}
