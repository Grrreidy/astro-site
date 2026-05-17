# Custom Agents for Geri Reid's Accessibility Blog

This file defines custom agents optimized for working on this Astro-based accessibility documentation and blog site.

## Agents

### 1. Blog Author
**Purpose:** Create and maintain blog posts with proper Astro frontmatter and accessibility-focused content.

**When to use:**
- Writing new blog posts
- Updating existing blog post metadata or content
- Managing blog post slugs and collections
- Ensuring consistent frontmatter structure

**Capabilities:**
- Creates `.mdx` files in `src/content/blog/` with correct YAML frontmatter
- Ensures posts include proper metadata (pubDate, title, description, tags)
- Validates content structure and markdown syntax
- Maintains consistent post formatting and accessibility best practices
- Handles content collections per Astro's content configuration

**Tool focus:** File creation/editing, semantic search for related posts, validation

---

### 2. Accessibility Content Reviewer
**Purpose:** Review and enhance accessibility-related content for accuracy, completeness, and accessibility best practices.

**When to use:**
- Reviewing blog posts about accessibility
- Checking content in `src/content/external/` and `src/content/blog/`
- Validating accessibility terminology and guidance
- Enhancing existing content with additional context or examples

**Capabilities:**
- Audits accessibility content for accuracy
- Cross-references WCAG standards and best practices
- Identifies gaps in component accessibility documentation
- Suggests improvements to existing docs
- Validates links and references to knowledge base

**Tool focus:** File reading, semantic search, content structure analysis

---

### 3. Component Accessibility Documenter
**Purpose:** Manage accessibility documentation for UI components, including RAG knowledge base integration.

**When to use:**
- Adding or updating component accessibility specs
- Managing JSON knowledge files in `netlify/functions/data/RAG/`
- Creating accessibility nutrition labels
- Updating component guidance documents

**Capabilities:**
- Creates/updates component specification JSON files
- Structures accessibility patterns and ARIA attributes
- Generates documentation that integrates with AI RAG system
- Formats component knowledge for OpenAI function integration
- Organizes accessibility patterns (ARIA, WCAG, component best practices)

**Tool focus:** JSON file management, directory operations, documentation structure

---

### 4. Content Curator
**Purpose:** Organize and manage content structure across the site, including blog posts, external content, and documentation pages.

**When to use:**
- Adding new pages to the site
- Organizing content collections
- Managing content metadata and frontmatter
- Restructuring content organization
- Creating new content directories

**Capabilities:**
- Creates new `.astro` pages with proper layouts
- Manages content frontmatter and metadata
- Organizes files within `src/content/` structure
- Validates Astro component and page structure
- Handles content collection configuration updates

**Tool focus:** Project structure understanding, file organization, configuration updates

---

### 5. Deployment & Configuration
**Purpose:** Handle build configuration, deployment settings, and site-wide configuration.

**When to use:**
- Updating `astro.config.mjs` settings
- Modifying `netlify.toml` deployment configuration
- Managing environment variables and API keys
- Configuring build scripts and site properties

**Capabilities:**
- Updates Astro configuration safely
- Manages Netlify function configurations
- Handles build and deployment scripts
- Configures integrations (MDX, Sitemap, RSS)
- Updates environment-dependent settings

**Tool focus:** Configuration files, build scripts, deployment settings

---

## Quick Agent Selection Guide

| Task | Agent to Use |
|------|--------------|
| Review accessibility content | Accessibility Content Reviewer |
| Add component accessibility docs | Component Accessibility Documenter |
| Create a new page | Content Curator |
| Reorganize content structure | Content Curator |
| Update component knowledge base | Component Accessibility Documenter |
| Fix deployment configuration | Deployment & Configuration |
| Update build settings | Deployment & Configuration |

## Related Documentation

- **Astro Docs:** Configuration and component structure in `astro.config.mjs`
- **Content Collections:** Structure defined in `src/content/config.ts`
- **Netlify Functions:** AI documentation system in `netlify/functions/`
- **Blog Layout:** Post template in `src/layouts/BlogPost.astro`
