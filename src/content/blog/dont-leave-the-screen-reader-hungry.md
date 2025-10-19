---
title: "Don't leave the screen reader hungry"
description: "Screen readers don’t always announce what’s in the HTML. This article explores that gap, through the medium of burritos."
pubDate: "2025-12-30"
image: "/public/images/open-graph.png"
author: Geri Reid
draft: true
---

# Don't leave the screen reader hungry

## The burrito you can't order

A customer complained they couldn't order a burrito. "My local sandwich shop advertises burritos, but my screen reader won't let me order one!"

I was baffled. The menu page was about as Mexican as a Yorkshire pudding. There was no mention of a burrito. 

After a lot of searching, I discovered someone had dropped an emoji into the heading `<h2>Sandwiches 🌯</h2>`. Visually, it looks decorative. But screen readers don't read an emoji as decoration, they announce its Unicode character name. So screen reader users heard: "Sandwiches, Burrito."

That little emoji isn't just sitting in your markup looking pretty. It's making promises your website can't keep. One tiny flourish in your heading tag and suddenly your sandwich bar sounds like a taqueria.

## What's on the menu?

What I'm highlighting here is screen readers don't consistently announce what you see visually on the screen. This article explores the gap between what HTML gives you for free and what you need to supply yourself. I've made some quick reference tables to demonstrate how popular screen readers JAWS, NVDA, and VoiceOver handle elements, showing where the browser does the work and where you need to add stuff in addition.

Most designers and engineers I work with are surprised by how much HTML provides by default. It's easy to over-engineer screen reader announcements that the browser and assistive tech already handle. Documenting and recording screen reader requirements is also problematic, so it sometimes falls through the gaps between design and code. I’ve got some ideas to help solve this.

You hungry? 

Since you're probably craving Mexican food by now, we're going to frame this through the medium of burritos. Put your apron on, taquero - it's time to get cooking. 

Let’s imagine the browser is your tortilla: it holds everything together. HTML adds some fillings by default. For a successful burrito, you need the right toppings. The trick is knowing which toppings to add and when to stop.

---

## What you get for free (the fillings)

Like a burrito that comes with rice, beans and your choice of protein, semantic HTML automatically packs the essentials into your tortilla. Correctly marked-up headings, links, buttons, lists, form controls, and tables are announced by default. And like a burrito starts with a good tortilla, screen readers work best when paired with their preferred browser: 

- JAWS with Chrome on Windows
- NVDA with Firefox or Chrome on Windows
- VoiceOver with Safari on Apple

Here's how JAWS, NVDA and VoiceOver screen readers announce for me using their default settings (I've included my testing specs in the footer). Use this as a guide. Your announcements might differ slightly based on verbosity and device settings, browser and software version. The way you navigate also changes what you hear. For example, using a heading shortcut key may produce a different announcement than letting the screen reader read through linearly.

The exact announcement doesn't really matter. 

What matters is knowing what you get for free and when you have to add something to get meaningful announcements. 

| Element                                                                        | JAWS says                                                | NVDA says                                                     | Mac OS VoiceOver says                                                                  | Annotation                                                                     |
| ------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `<h1>Burritos</h1>`                                                            | “Burritos, Heading level 1”                              | “Burritos, Heading level 1”                                   | “Heading level 1, Burritos”                                                            | No extras needed. Use correct heading levels for structure.                    |
| `<button>Checkout</button>`                                                    | “Checkout button”                                        | “Checkout, button”                                            | “Checkout, button”                                                                     | No extras needed. A button includes role and label automatically.              |
| `<a href="burrito.html">Order burrito</a>`                                     | “Order burrito, link”                                    | “Order burrito, link”                                         | “link, Order burrito”                                                                  | No extras needed. Just make sure the link text makes sense out of context.     |
| `<ul> <li>Burrito</li> <li>Taco</li> </ul>`                                    | “List of 2 items. Bullet Burrito. Bullet Taco. List end” | “List with 2 items. Bullet Burrito. Bullet Taco. Out of list” | “List 2 items.&#xA;Bullet Burrito, 1 of 2. &#xA;Bullet Taco, 2 of 2.&#xA;End of list.” | No extra needed. Lists announce count and items. Use semantic \<ul> and \<li>. |
| `<label for=name">Name</label> <input id="name" type="text">`                  | “Name, edit”                                             | “Name, edit”                                                  | “Name, edit text”                                                                      | No extra needed.                                                               |
| `<input id="cheese" type="checkbox"> <label for="cheese">Extra cheese</label>` | “Extra cheese, check box, not checked”                   | “Check box, not checked, Extra cheese”                        | “Extra cheese, unticked, tick box”                                                     | No extra needed.                                                               |
| `<button disabled>Not taking orders</button>`                                  | “Order, button, unavailable”                             | “Button unavailable, Order”                                   | “Order, dimmed, button”                                                                | No extra needed. Visually appears disabled, not focusable.                     |

---

## What you must supply (the toppings)

Here’s where you roll up your sleeves. These elements stay silent or may not announce as you’d expect until you add the right toppings.

| Element                                                   | JAWS says                                | NVDA says                               | Mac OS VoiceOver says               | Annotation                                                                  |
| --------------------------------------------------------- | ---------------------------------------- | --------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `<img src="burrito.png">`                                 | "Unlabelled graphic"                     | "Unlabelled graphic"                    | “Unlabelled image” or "burrito.png" | Add alt text describing the image. Or use `alt=""` if decorative.           |
| `<button aria-disabled="true">Not taking orders</button>` | “Not taking orders, button, unavailable” | “Button unavailable, Not taking orders” | “Not taking orders, dimmed, button” | Add 'disabled' styling. Still focusable so may confuse screen reader users. |
| `<button><svg>…burrito svg icon ...</svg></button>`       | “unlabelled button”                      | “button”                                | “button”                            | Add accessible name via `aria-label` or `aria-labelledby`.                  |
| `<iframe src="promo.html"></iframe>`                      | “frame”                                  | “frame”                                 | “frame”                             | Add a descriptive title for context.                                        |

The trick: add the toppings that matter, but don't overload the burrito. An overstuffed burrito can fall into your lap, potentially ruining a first date.

---

## Edge cases and oddities (HTML Hell's Kitchen)

These ingredients look tasty but behave unpredictably under heat. Use with caution or your markup might fall apart.

| Element                                                                | JAWS says                                          | NVDA says        | Mac OS VoiceOver says | Annotation                                                                                                                        |
| ---------------------------------------------------------------------- | -------------------------------------------------- | ---------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `<strong>Burrito!</strong>`                                            | “Burrito”                                          | “Burrito”        | “Burrito”             | Emphasis not reliably spoken on default verbosity settings. Don’t rely on for meaning.                                            |
| `<em>Spicy</em>`                                                       | “Spicy”                                            | “Spicy”          | “Spicy”               | Emphasis not reliably spoken on default verbosity settings. Don’t rely on for meaning.                                            |
| `£8 <s>£10</s>`                                                        | “£8 strikethough deletion £10”                     | “£8 deleted £10” | “£8 £10”              | Strikeout not reliably announced. Add `aria-label` to clarify meaning.                                                            |
| `<sup>2</sup> / <sub>2</sub>`                                          | “2, 2”                                             | “2, 2”           | “2, 2”                | Not read as superscript or subscript. Add `aria-label` to clarify meaning.                                                        |
| `<hr>`                                                                 | “separator”                                        | “separator”      | Silent                | Don’t rely on for meaning. Add `aria-label` if the separation needs context.                                                      |
| `<abbr title="Street Provisions In Corn-based Envelopes">SPICE</abbr>` | “SPICE, Street Provisions In Corn-based Envelopes” | “Spice”          | “Spice”               | Full title not reliably announced. Spell out abbreviation in text.                                                                |
| 🌯                                                                     | “Burrito”                                          | “Burrito”        | “Burrito”             | Emojis announce their [Unicode name](https://unicode.org/emoji/charts/full-emoji-list.html). For decorative use, add aria-hidden. |

### **Help! My burrito is busted (what should announce?)**

- **If you're second-guessing what should announce**, TetraLogical recently released a [detailed guide to screen reader announcements](https://github.com/TetraLogical/screen-reader-HTML-support?tab=readme-ov-file) along with an [HTML Element test file](https://stevefaulkner.github.io/AT-browser-tests/)  you can run your screen reader over to test elements in isolation.
- **If you’re looking for video examples** of how elements and components announce, check out the [HTML section of atomica11y](https://www.atomica11y.com/accessible-web/). 
- **If you work on a Mac and need to test on Windows screen readers**, try [AssistivLabs](https://assistivlabs.com/) or set up an [emulator like UTM](https://getutm.app/). You can run NVDA for free and JAWS has a free 40 minute developer mode which is sufficient for testing. [40% of the screen reader market uses JAWS](https://webaim.org/projects/screenreadersurvey10/#primary) so if you only test on VoiceOver you might miss issues.

---

## Documenting screen reader requirements

If you're building a website, you need a consistent way to document screen reader announcements. Don't leave it up to chance. Current design tools don't have space for accessibility information and much of it is non-visual, so it easily gets overlooked during implementation.

Visual annotation kits for Figma, Sketch or Penpot offer a solution. There are plenty of excellent open-source examples shared in community files that you can tailor to your organisation's needs. If you're looking for inspiration, Jan Maarten and Daniel Henderson-Ede did a talk showcasing how [different design teams annotate for accessibility](https://www.youtube.com/live/O1GmngpGokU?si=Y6uxWmX1Z6pxfRDD) at this year's Inclusive Design 24.

As a designer, I find it helpful to pair with an engineer and mark up design files together to capture all the accessibility requirements. 

A problem with sticky note annotations is that they often die in design files once development begins. Developers don't revisit design files, designers move on and the accessibility details you've spent time documenting get lost. Even if they are used effectively in implementation, you end up rewriting a similar set of notes for subsequent projects.

Text-based documentation in machine-readable formats (YAML, JSON, markdown tables, or structured specifications) solves this. Instead of static notes trapped in design files, if you record your annotations as text you can create queryable records that travel. Think of it like your restaurant having a digital ordering system instead of handwritten tickets. The kitchen gets the exact burrito order every time, with all the special instructions intact. 

These formats also unlock AI integration through tools like RAG or MCP servers. When a developer asks an AI assistant about a component, it can surface the exact accessibility requirements. You could even structure these specs to generate automated test criteria.

The long game: shift to living documentation that can be queried on demand. Some clever folks like Nathan Curtis have already started ​to explore ways to [record specs with data](https://medium.com/@nathanacurtis/components-as-data-2be178777f21).

---

### Let's wrap up! 

- HTML gives you a tortilla full of free fillings: headings, lists, buttons, form controls, tables. However, some elements require you to add a topping to make them meaningful. 
- Document which toppings are needed so they don't get lost between design and development. Without clear documentation, developers have to guess at the requirements or skip them entirely, leaving accessibility as an afterthought rather than an integral part of the build.

Get it right and your screen reader users get a memorable burrito. Get it wrong and they're left with a stain on their shirt. Remember that good burrito, like good markup, is about knowing which toppings to add and when to stop.

---

#### Tested on:

- JAWS (2025) tested with Chrome Version 140.0.7339.128 (Official Build) (64-bit) on Windows 11
- NVDA (2025) tested with Chrome Version 140.0.7339.128 (Official Build) (64-bit) on Windows 11
- VoiceOver (2025) on Mac tested with Sequoia 15.7.1 on Safari Version 26.0.1