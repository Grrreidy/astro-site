# **Accessibility for Designers**

This is a checklist to help you create accessible mockups and document designs for engineering. Many accessibility issues can be caught in the design phase.


# Appearance

## Colour

- [ ] Check that **colour** is **not the only visual way to convey information**, indicate an action, prompt a response or distinguish a visual element ([1.4.1](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html)) 

- [ ] Check **colour combinations** have **sufficient contrast** against the background

* **Text** contrast ratio should be at least:  
  * **4.5:1** for text **smaller than 24px**, or 19px bold   
  * **3:1** for text **larger or equal to 24px,** or 19px bold  
    This also applies to text on images ([1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html))

* **Non-text interface components** and **graphics** should be at least:  
  * **3:1 contrast ratio** against the boundaries of the UI component (border, background) and adjacent colours ([1.4.11](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html))

* **Focus** visible state of an element:  
  * at least **3:1 contrast ratio** against the background colour ([1.4.11](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html))


| Check colour contrast: [WebAim colour contrast checker](https://webaim.org/resources/contrastchecker/) [Figma contrast plugin](https://www.figma.com/community/plugin/748533339900865323/contrast) 
[Colour Oracle: Colour vision simulator](https://colororacle.org/) 
[Who Can Use](https://www.whocanuse.com/?bg=f36805&fg=ffffff&fs=16&fw=) this colour combination 
[Intro to colour contrast](https://goodpractices.design/articles/colour-contrast) \- excellent deep dive |

##  Text

- [ ] Check **text resizing behaviour**. Make sure text content can be enlarged to **200%** without hiding elements or missing functionality ([1.4.4](https://www.w3.org/WAI/WCAG21/Understanding/resize-text))

      * Avoid fixed-height buttons and text boxes  
      * Text must be resizable without browser zoom. Use rem units for the CSS font-size property and no units for the line-height property  
      * Allow for dynamic type in iOS and scalable pixels in Android  
      * Adapt the layout to fit a larger font size. *For example: multiple columns might become one, secondary text on the right might go to the next line*  
      * Avoid truncation when the text gets larger. Spec out scenarios if truncation is unavoidable

* Check the user can change **text style properties** without loss of content or functionality:

  * Line height (line spacing) to at least 1.5 times the font size  
  * Spacing following paragraphs to at least 2 times the font size  
  * Letter spacing (tracking) to at least 0.12 times the font size  
  * Word spacing to at least 0.16 times the font size

Things to avoid: 

* long line lengths (max 75 characters for English)  
  * underlining words that aren’t links  
  * justified text (it can be hard to read on-screen)  
  * italic and all caps for long passages of text

# Interactions

## Buttons and links

- [ ] Check that **colour is not the only way to identify a link** from surrounding text ([1.4.1](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html)). The easiest way is to **underline links in text**

 * If colour is the only way to identify the link, it must have a **3:1 contrast ratio with adjacent non-link text** and **provide additional visual cues on hover**

|  📙 Check if your link styling is compliant: [Contrast-triangle.com](https://contrast-triangle.com/) |
| :---- |

- [ ] Check that **labels of buttons and links are clear, descriptive, and reflect their purpose**. Does the user understand what will happen if they interact with it? ([2.4.4](https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html))

      * Use direct action verbs (open, cancel, close)

      * If multiple buttons or links have same destination, they should have the same label ([3.2.4](https://www.w3.org/WAI/WCAG21/Understanding/consistent-identification.html))

      * Avoid instruction based on space, shape, size, colour or visual indication ([1.3.3](https://www.w3.org/WAI/WCAG21/Understanding/sensory-characteristics.html)) *For example: avoid “Select the red button”, prefer “Select start”* 

      * Add format and size if it’s a link to download a file

      * Avoid opening links in a new tab. If you do, inform the user about the behaviour change ([3.2.5](https://www.w3.org/TR/UNDERSTANDING-WCAG20/consistent-behavior-no-extreme-changes-context.html))

- [ ] Check that the **button hierarchy** communicates the importance of buttons (primary, secondary, tertiary). There should only be **one primary button** per screen or view.

- [ ] Check the **size of targets** (links, buttons):

      * Target size for links and buttons must be at least 24x24 CSS pixels ([2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)) 

      * For targets **smaller than** **24x24 CSS pixels**, check that you have enough spacing between them. To test, draw a 24px diameter circle around the targets (starting in the centre of the element) and make sure they don’t overlap.

      * For mobile, **touch target sizes** are at least **44x44 CSS pixels** ([2.5.5](https://www.w3.org/WAI/WCAG21/Understanding/target-size) \- AAA)

        

|  📙 [Designing accessible, WCAG-conformant focus indicators](https://www.sarasoueidan.com/blog/focus-indicators/#1.-the-focus-indication-area-and-the-contrasting-area) \- Sara Soueidan |
| :---- |

| Interactions: What to document?  Document the different states required for links  Default  Hover Focus Active	 Visited Document the different states required for buttons Default Hover Focus Active Disabled Selected *toggle switches for example* Loading |
| :---- |

## Forms and inputs


- [ ] Check **forms field labels** are clear and help the user to complete the field ([3.3.2](https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions))   
      Labels should be:

      * **visible** and **programmatically linked** to the field ([1.3.1](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships))  
      * **named consistently** if used in multiple places ([3.2.4](https://www.w3.org/WAI/WCAG21/Understanding/consistent-identification))   
      * **close** to the input field so they are visually linked  
      * **NOT a placeholder**
      

- [ ] Check that forms containing **legal and financial data** allow one of these ([3.3.4](https://www.w3.org/WAI/WCAG21/Understanding/error-prevention-legal-financial-data.html)):

      * a way for users to **reverse or change** the data they submitted  
      * a way to **check and correct** the data entered before submitting  
      * a way to **review, confirm and correct** information before final submission

- [ ] Check **error messages:**

      * **are not indicated with just colour alone**. Add an icon or increase the size of the form field border ([1.4.1](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color))  
      * **are clear** and self-explanatory, written in plain language ([3.3.1](https://www.w3.org/WAI/WCAG21/Understanding/error-identification))

      

- [ ] Check that fields that belong together are **visually and programmatically grouped** ([1.3.1](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships)) *For example: address fields*   
        
- [ ] Check users don’t have to **input the same information twice**, in a single session. Auto-populate instead, or make info available for the user to select ([3.3.7](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry))

| Resources: [Labelling form fields](https://www.marcozehe.de/the-web-accessibility-basics/#labeling-form-fields) \- Marco Zehe [Grouping form controls](https://www.w3.org/WAI/tutorials/forms/grouping/) \- Web Accessibility Initiative [How to write clear error messages](https://design-system.service.gov.uk/components/error-message/) \- Government Digital Service [Best practice form advice](https://adamsilver.io/blog/form-design-from-zero-to-hero-all-in-one-blog-post/) \- Adam Silver |
| :---- |

| Forms and inputs: What to document?  Document the different states needed form elements:  Default empty Default filled Focused Disabled Checked  Unchecked Document the different statuses required for form elements:  Default Error Success *Warning (if needed)* Document form field status treatments like error messages in different scenarios. |


# Navigation and wayfinding

## Semantic structure

- [ ] Check the structure of content on the  logical  
      

| Structure: what to document?  Document an informative HTML title \<title\> for each page. The title must be unique and describe the content of the page. ([2.4.2](https://www.w3.org/WAI/WCAG21/Understanding/page-titled)) Document landmark regions on the page, to help screen reader users orientate ([1.3.1](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships)) Keep in mind that every HTML sectioning element automatically creates ARIA landmark regions.  Document content reading order for screen readers if it’s complex or if it’s different to the visual order. Ideally, you want reading order to stay the same. ([1.3.2](https://www.w3.org/WAI/WCAG21/Understanding/meaningful-sequence)) |
| :---- |

| 📙 Resources: [Main landmark: ARIA landmarks example](https://www.w3.org/WAI/ARIA/apg/example-index/landmarks/main.html) [Landmark regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/) |
| :---- |

## Headings

- [ ] Check headings:  
      - [ ] are **consistent and describe the content** ([2.4.6](https://www.w3.org/TR/UNDERSTANDING-WCAG20/navigation-mechanisms-descriptive.html))  
      - [ ] **follow semantic order** ([1.3.1](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships)) *For example: h1, h2, h3*

Don’t:

* use **more than one h1** per page  
  * use **paragraph text with a larger font** instead of a semantic heading ([1.3.1](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships))  
  * use **headings just for styling** because you want a visually larger text ([1.3.1](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships))  
  * **skip heading levels** *For example: don’t jump from h1 to h4*  
    

| 📙 Guide to semantic heading structure: [WebAim](https://webaim.org/techniques/semanticstructure/#headings) |
| :---- |

## Keyboard navigation and focus order

- [ ] Check users can **perform all the actions using keyboard alone** ([2.1.1](https://www.w3.org/WAI/WCAG21/Understanding/keyboard))

      * Check for **focus traps**. Make sure the user doesn’t get stuck in part of the interface using keyboard alone ([2.1.2](https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap))

      * Check the **focused element is never completely covered** by other content ([2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum))

      * Check there is **no change of context** when a component receives focus. The change only happens when the user activates an action (enter or space key)  ([3.2.1](https://www.w3.org/WAI/WCAG21/Understanding/on-focus))  
          
- [ ] Check there is a logical and consistent **focus order** ([2.4.3](https://www.w3.org/WAI/WCAG21/Understanding/focus-order))

- [ ] Provide a **skip link** to **skip to the main content** (typically by bypassing the navigation). Skip link must be the first keyboard-focusable element on the page ([2.4.1](https://www.w3.org/TR/UNDERSTANDING-WCAG20/navigation-mechanisms-skip.html))  

| Keyboard: what to document?  Document focus order in your designs using a Figma’s [dev mode annotations](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode#h_01HNG25N6S0DP0355T4W28P1HY) Skip Links are often “invisible” by default but are visible on focus (and announced by screen readers). Document their treatment for engineers. With the help of an accessibility specialist or engineers, you can also document the following for interactive elements: HTML semantics for elements and components ARIA roles  ARIA states and properties ARIA live regions (for dynamic content) |
| :---- |

| 📙 Resources: [How to browse the web with the keyboard alone](https://www.tempertemper.net/blog/how-to-browse-the-web-with-the-keyboard-alone) \- Martin Underhill [Browsing with a keyboard](https://tetralogical.com/blog/2021/10/26/browsing-with-a-keyboard/) \- Tetralogical [A table to help you with keyboard testing](https://webaim.org/techniques/keyboard/#testing) \- WebAim |
| :---- |

## Navigation across pages

- [ ] Check **navigation items are consistent across** the whole site ([3.2.3](https://www.w3.org/WAI/WCAG21/Understanding/consistent-navigation))  
      * Labels and link destinations must be consistent across pages  
      * Layout and placement of navigation must be the same on all pages

- [ ] Check there are **multiple ways of finding and accessing content** ([2.4.5](https://www.w3.org/WAI/WCAG21/Understanding/multiple-ways))   
      *For example: main navigation \+ search, navigation \+ sitemap*  
        
- [ ] Check help is in a **consistent location** on every page ([3.2.6](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help))  
      

# Content

## Images

- [ ] Check images have **alt text**, if they are essential to understanding the journey ([1.1.1](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html)) 

Don’t:

* Use **images of text** ([1.4.5](https://www.w3.org/WAI/WCAG21/Understanding/images-of-text.html))


| 📙 [How to write text descriptions: BBC GEL](https://www.bbc.co.uk/gel/features/about-text-descriptions) |
| :---- |


| Images: what to document?  Document alt text for images that are not just decorative ([1.1.1](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html)) Document alt text for icons that are not decorative and don’t have a visible (or programmatic) label ([1.1.1](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html)) Document detailed text explanations for complex images like heavy illustrations, infographics, and data visualizations  |
| :---- |

## Multimedia

- [ ] Check you are providing additional support for audio and video content:

      * **a text transcript** as an alternative to pre-recorded audio and video ([1.2.1](https://www.w3.org/WAI/WCAG21/Understanding/audio-only-and-video-only-prerecorded))

      * **captions for pre-recorded video with audio,** that are time synchronised with the media ([1.2.2](https://www.w3.org/TR/UNDERSTANDING-WCAG20/media-equiv-captions.html))

      * **captions for live audio content** ([1.2.4](https://www.w3.org/TR/UNDERSTANDING-WCAG20/media-equiv-real-time-captions.html)). Explain to users of video conferencing tools like [Google Meet](https://support.google.com/meet/answer/10964115) and [Zoom](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0059762) how they can turn these on

      * **controls** for any **audio that plays automatically for more than 3 seconds** ([1.4.2](https://www.w3.org/WAI/WCAG21/Understanding/audio-control.html))  
        * Mechanism to pause / stop the audio  
        * Mechanism to control the audio volume independently of the system

      * **for information conveyed by audio**, provide and document **a second non-audio way** to convey it in the interface. Consider status and notification alerts through visual (dots, badges) or haptic feedback in addition to sound ([1.3.3](https://www.w3.org/WAI/WCAG21/Understanding/sensory-characteristics))   
        *For example: if you use “start after the beep”, have a visual representation of the “beep” in the interface*

Don’t:

* autoplay audio and video


| 📙 [Making audio and video media accessible \- W3C](https://www.w3.org/WAI/media/av/) |
| :---- |

## Charts and graphs

- [ ] Check that charts **respect the WCAG colour guidelines:**  
      * information is not conveyed by colour alone ([1.4.1](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html))  
      * text has a sufficient contrast ratio against the background ([1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html))  
      * there is at least a 3:1 contrast ratio against the boundaries of the chart elements and adjacent colours ([1.4.11](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast))

| Charts and graphs: what to document?  Document an alternative for charts ([1.1.1](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html)), for example: if the chart is an image, provide alt text describing the content for complex dataviz, provide a long text description directly next to the chart or linked to it consider supplying thed chart content in a table format (if you can’t summarise the graph’s message because people need to compare the data) Document how users can interact with the chart with keyboard navigation Document what should be read for each point and work with engineers to ensure that the content of the chart is properly read by a screen reader |
| :---- |

        

| 📙 [How to make charts and graphs more accessible \- PopeTech](https://blog.pope.tech/2023/08/31/how-to-make-charts-and-graphs-more-accessible/) |
| :---- |

## Numbers

- [ ] Check you are showing numbers plainly and in a way that is easy for everyone to understand  
      * **remove unnecessary numbers** and decimal places, unless it’s money  
      * leave **space around numbers** so they are easier to read and understand   
      * **explain what numbers mean** and **add** **context** about why the numbers matter  
      * **fill in the information we already have** and don’t expect people to remember numbers or codes

| 📙 Resources: [The Accessible Numbers Project](https://accessiblenumbers.com/) [Designing for people with dyscalculia and low numeracy](https://designnotes.blog.gov.uk/2022/11/28/designing-for-people-with-dyscalculia-and-low-numeracy/) \- Design in Govt |
| :---- |

## Tables

- [ ] Check that a table is the correct component to use  
      * Use tables to **present data** that users can **compare and scan**, not for layout or visual presentation

- [ ] Check data is easy to understand:  
      * **Align text left** and **numeric data right**  
      * Use **zebra striping** to make it easier to scan

- [ ] Check you have considered **all viewports** and how the table will scale on small screens  
      

| Tables: what to document?  Tables need specific HTML code to be accessible. The screen reader uses this code to announce the information in the table correctly. For simple tables, provide:  A title (caption) that lets the user understand what to expect in the table Clear table headings for each row or column For interactive tables (where users can select things, order, edit, insert, etc.), define and document what you expect from the complex table, and check with your engineers how to implement [data grids](https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/data-grids/) Make sure elements in the table are navigable by rows and columns using assistive technologies and keyboard Responsive designs to fit larger and small viewports |
| :---- |

| 📙 Resources: [Data Tables, Inclusive Components](https://inclusive-components.design/data-tables/) \- Heydon Pickering [Guide to accessible tables](https://blog.pope.tech/2023/08/22/beginners-guide-to-accessible-tables) \- Pope Tech |
| :---- |

## Screen orientation 

- [ ] Check your layout works in both **portrait and landscape mode.** Don’t block orientation change ([1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html))

- [ ] Check adaptation of content (text, images) in both modes to ensure no content is hidden, missing or overlapping  
      

| Screen orientation: what to document?  Document designs for different screen orientation  |
| :---- |

## Animation

- [ ] Check there is a way to **control moving, scrolling, blinking or auto-updating** content that starts automatically, lasts more than **5 seconds** and is on a page with other content ([2.2.2](https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide)). Provide:  
      * a button to **play/stop the motion** or **hide the moving content**  
      * or a mechanism to show the information, **without any moving or blinking**

- [ ] Check there is a way to **reduce motion for animations**  
      * offer an alternative for motion that might trigger motion sickness ([2.3.3](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions))

- [ ] Check there is **no flashing content** that flashes **more than 3 times per second** ([2.3.1](https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold))

| Moving content: what to document?  Document how to control movement how interactions appear with reduced motion |
| :---- |

      

| 📙 Stephanie Walter: [Building Accessible and Inclusive Animations](https://stephaniewalter.design/blog/enhancing-user-experience-with-css-animations/#accessibility)  |
| :---- |

## Time limits

- [ ] Check that the user has **control over time limits** (if the time limit is smaller than 20 hours) with at least 1 of the 3 ways ([2.2.1](https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable)):  
      * User can **turn off** the time limit  
      * Time limits can be **adjusted by the user** (add more time if needed)  
      * User is **warned before time expires** and has at least 20 seconds to extend the time limit with a simple action (at least 10 times)

## Notifications

- [ ] Check you are using a component with the **right level of priority** and intent ([4.1.3](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html))  
      * **Critical notifications** and alerts that interrupt the user’s flow should be used sparingly. The user ideally needs to interact with a critical alert to close or confirm with an action  
      * **Less critical updates** and status messages like toasts should not interrupt the user’s flow

| Notifications: what to document?  Document each stage in the notification process and specify how the user should be alerted |


# WCAG

| 📙 Resources: [How to Meet WCAG](https://www.w3.org/WAI/WCAG22/quickref/?versions=2.2) [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/)  WCAG in plain language [WCAG explained \- Stark](https://www.getstark.co/wcag-explained/) [Design criteria in plain language](https://www.gerireid.com/wcag-for-designers.html) [WCAG \- Quick reference guide](https://guia-wcag.com/en/) Checklist [A11yproject checklist](https://www.a11yproject.com/checklist/) Free automated checkers [WebAim WAVE](https://wave.webaim.org/) [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) |
| :---- |
