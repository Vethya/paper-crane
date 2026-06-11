# Resume Components Feature Spec

## Purpose

Resume components are reusable resume form items that help users build and tailor
saved resumes faster by adding, removing, and rearranging reusable pieces.

Examples:

- A school entry
- A work experience entry
- A skill group
- A project
- An award

Components are library items. When added to a resume, they are copied into that
resume. They are not live-linked.

## Core Decisions

- Components are copy-on-add.
- Editing a saved component later does not update resumes where it was used.
- Editing a resume item copied from a component does not update the saved
  component.
- Components are available only to signed-in users.
- `/components` follows the same auth behavior as `/resumes`.
- Components are part of the saved-resume workflow.
- The generator Components panel is shown only when editing a saved resume with
  an `id`.

## Component Types

V1 supports only types that already have generator form UI:

| Component Type | Data Key |
|---|---|
| Schools | `education` |
| Work | `work` |
| Skills | `skills` |
| Projects | `projects` |
| Awards | `awards` |

Code should use the existing form array keys:

- `education`
- `work`
- `skills`
- `projects`
- `awards`

Components do not support profile, strengths, languages, coursework, tags,
import/export, bulk actions, type conversion, or changing type after creation in
v1.

## Component Shape

Components should be replicas of the matching generator form item as much as
possible.

There is no separate component title field. Display titles are derived from the
component content.

Recommended model:

- `userId`
- `type`
- `content`
- `createdAt`
- `updatedAt`

Use a separate Mongo collection, for example `ResumeComponent`.

Do not track `createdFromResumeId` or source metadata in v1.

Using a component should not update its `updatedAt`.

## Required Fields

Empty components are not allowed from any creation path.

Each type requires its primary field:

| Type | Required Field |
|---|---|
| School | Institution |
| Work | Company |
| Skill | Skill name |
| Project | Project name |
| Award | Award title |

Other fields may be blank.

Validation should happen on both client and server.

## Duplicate Rules

Exact duplicate components should not be saved to the component library.

Duplicate prevention applies only when saving components to the library:

- Creating from `/components`
- Creating from the generator panel
- Dragging a form item into the Components panel

Adding a component into a resume may create duplicate resume entries.

Duplicate comparison should:

- Compare full meaningful component content, not only the primary field.
- Ignore empty fields.
- Respect array ordering.
- Trim leading/trailing whitespace.
- Collapse repeated internal whitespace.
- Compare strings case-insensitively.
- Avoid fuzzy matching or substring matching.

When a duplicate is blocked:

- Show a global toast.
- Highlight the existing matching component.
- In the editor modal, keep the modal open.

## API

Use REST endpoints modeled after `/api/resumes`:

- `GET /api/components`
- `POST /api/components`
- `PATCH /api/components/[id]`
- `DELETE /api/components/[id]`

All component API routes must:

- Require auth.
- Scope data by `userId`.
- Validate component type.
- Validate required primary field.
- Block exact duplicates.
- Reject attempts to change component type on edit.

List responses should include full component content because the generator panel
needs to add items without an extra fetch and `/components` needs the content for
editing.

Sorting should be newest updated first.

Search is client-side in v1.

## `/resumes` and `/components` Navigation

Add a shared centered nav for the authenticated library area:

- `Resumes` -> `/resumes`
- `Components` -> `/components`

Use this shared nav on:

- `/resumes`
- `/components`

Do not show this top-center page nav in `/generator`.

`/components` should visually match `/resumes` with the same dark app shell and
shared `Header`.

## `/components` Page

The `/components` page is the component library management surface.

It should include:

- Shared `Resumes / Components` nav.
- Component type tabs.
- Tab counts.
- Search box.
- Active-tab `New` button.
- Component cards.
- All-empty state when the user has no components.
- Per-tab empty state when the active tab has no components.

Default tab:

- `Work`

The active tab should live in the URL query:

- `/components?type=work`
- `/components?type=projects`

Tab labels:

- `Schools`
- `Work`
- `Skills`
- `Projects`
- `Awards`

The `New` button uses the active tab type:

- `New School`
- `New Work Experience`
- `New Skill`
- `New Project`
- `New Award`

Create and edit should open a modal/dialog.

Editing and deleting are supported in v1.

Deleting requires confirmation with copy similar to:

> Delete this component? Existing resumes won't be changed.

No bulk actions in v1.

## Generator Components Panel

The generator should have a clearly visible Components button:

- Desktop: in the left sidebar directly above the `MAKE` button.
- Mobile: below the horizontal section tabs.

The button is shown only when editing a saved resume with an `id`.

Desktop behavior:

- Clicking Components replaces the right preview panel with the Components panel.
- Clicking Components again closes the panel.
- The panel header also has a close icon button.
- The panel stays open after adding a component.

Mobile behavior:

- Components opens as a full-screen sheet.
- Mobile uses Add buttons only for adding components in v1.
- Mobile does not need drag-and-drop support in v1.

When opening the panel:

- If the current form section maps to a component type, open that tab.
- If current section is `Templates`, `Profile`, or another non-component type,
  default to `Work`.

The panel tab and current form section are independent after opening.

The panel includes:

- Component type tabs.
- Counts if space allows.
- Search.
- Active-tab `New` button.
- Component cards.
- Empty-tab create button.
- Link to open the full Components Library in a new tab.

The library link should preserve active type:

- `/components?type=projects`

## Adding Components To A Resume

Add button behavior:

- Appends the component to the end of the matching section.
- Switches the form to that section.
- Expands the newly inserted item.
- Keeps the Components panel open.

Desktop drag behavior:

- Users can drag a saved component card from the panel into the form.
- Drag is type-locked to the matching section.
- Drag start auto-switches the form to the matching section.
- Users can place the item before or after any existing form item in that
  section.
- Show visible drop indicators between form items.
- Inserted items expand immediately.

Type-locking means:

- School components drop only into Education.
- Work components drop only into Work.
- Skill components drop only into Skills.
- Project components drop only into Projects.
- Award components drop only into Awards.

Preview behavior:

- Form data and autosave update immediately.
- PDF preview refresh remains tied to pressing `MAKE`.

## Form Item Reordering

All form item types that support components should be rearrangeable:

- Education
- Work
- Skills
- Projects
- Awards

Reordering rules:

- Same-section only.
- No cross-type moves.
- Use a dedicated drag handle on form items.
- Drag handle appears in the item header.
- Drag handle appears whether the item is expanded or collapsed.
- Dragging should not collapse expanded items.
- Preserve expanded/collapsed state as much as practical.
- Add keyboard-accessible move up/down controls.
- Show reorder controls only when useful.

Users should be able to remove the last item in component-supported sections.

When a section becomes empty:

- Keep its custom section heading.
- Do not introduce new section-management behavior.

The current UI does not expose section removal/reordering, so component insertion
does not need to modify `sections` behavior beyond preserving existing defaults.

## Saving Form Items As Components

Users can drag existing form items into the open Components panel.

Rules:

- The Components panel must be open.
- Show a dedicated drop zone such as `Drop here to save as component`.
- Save a reusable copy.
- Leave the resume item in place.
- Do not remove it from the resume.
- Validate required primary field.
- Block exact duplicates.
- Save immediately when valid.
- Show a global toast on success, duplicate, or failure.
- Highlight the saved or duplicate component.

Dragging form items into the panel is allowed only when the panel is open.

## Component Cards

Use one shared card component where practical.

Modes:

- `/components`: view details, edit, delete.
- Generator panel: view details, add, drag into form.

Cards should have visible action icons/buttons.

Cards should use consistent height with a two-line preview truncation.

Derived titles and previews:

| Type | Card Title | Preview Detail |
|---|---|---|
| School | Institution | Degree, major, location, dates, GPA |
| Work | Company | Position, location, dates, first 1-2 responsibilities |
| Skill | Skill name | Keywords |
| Project | Project name | Description, tools, URL |
| Award | Award title | Awarder, date, summary |

Fallback titles:

- `Untitled school`
- `Untitled work experience`
- `Untitled skill`
- `Untitled project`
- `Untitled award`

Cards should not show created/updated dates by default.

On `/components`:

- No drag handle.
- Clicking the card body opens details.
- Edit/delete remain visible icon buttons.

In the generator panel:

- Cards are draggable from anywhere on the card.
- Clicking the card opens details.
- Add button is visible on the card.
- Buttons inside the card should not trigger card click or drag.
- Use pointer movement threshold so normal click opens details and movement
  starts drag.

## Details Modal

Clicking a component card opens a details modal/dialog.

Details should use a formatted read-only preview, not the full editor layout.

Recommended details:

- Title/details at top.
- Field/value rows.
- Responsibilities/keywords as bullets or chips.
- Actions in the footer.

In the generator details modal:

- View and Add only.
- No edit/delete.

In `/components` details:

- Can provide Edit/Delete actions.

Read-only details close normally, including outside-click close.

## Editor Modal

Create/edit uses a shared component editor modal in both:

- `/components`
- Generator Components panel

The modal should:

- Use React Hook Form.
- Use shared item editor components.
- Reuse the exact current field editors:
  - Work uses `Highlights`.
  - Skills and Projects use `Keywords`.
  - Simple fields use `LabeledInput`.
- Use explicit Save.
- Discard unsaved changes when closed.
- Protect against accidental discard.
- Prefer blocking outside-click close for create/edit.
- Keep type fixed from active tab/context.
- Not include a type picker.

After creating from the generator panel:

- The component remains library-only.
- It is not automatically added to the current resume.
- It appears in the list highlighted with an Add action.

No warning is needed that component edits do not update existing resumes.

## Shared Item Editors

Extract shared field groups for each component-supported item type so generator
sections and component editor modals use the same field definitions.

Shared item editors should cover:

- Education item fields
- Work item fields
- Skill item fields
- Project item fields
- Award item fields

Nested list behavior remains separate:

- Work responsibilities keep their own `Highlights` controls.
- Skill/project keywords keep their own `Keywords` controls.
- Top-level item reordering should not interfere with nested list controls.

## Toasts

Use shadcn Sonner for global toasts.

Add:

- `sonner` dependency.
- Local `src/components/ui/sonner.tsx` wrapper.
- `<Toaster />` in `src/app/layout.tsx`.

Toasts should match the active app theme:

- Dark theme uses dark app surfaces.
- Light theme uses light app surfaces.
- Keep behavior standard and customize styling lightly.

Toast events:

- Component created.
- Component updated.
- Component deleted.
- Component added to resume.
- Form item saved as component.
- Duplicate blocked.
- Save/delete/API failure.

Do not toast routine actions:

- Tab changes.
- Search changes.
- Opening or closing panels.
- Reorder moves.

## Loading And Caching

Generator panel:

- Load components independently and lazily.
- Fetch when the panel opens or when a type is needed.
- Cache loaded lists per type during the page session.
- Refresh active type after create/edit/delete or drag-to-save.

`/components` page:

- Load all component types once.
- Use local search.
- Use all loaded data for tab counts.

Do not use optimistic mutations in v1. Update lists after the server confirms.

## Validation And QA

No automated tests should be added for this feature.

Do run existing project validation where practical, such as:

- `npm run build`
- `npm run lint`

Do manual browser QA for:

- Auth redirects.
- `/resumes` and `/components` nav.
- Component CRUD.
- Duplicate blocking.
- Theme-aware Sonner toasts.
- Generator panel open/close.
- Add button insertion.
- Desktop drag insertion with drop indicators.
- Desktop form item reorder.
- Desktop form-item-to-component save drop zone.
- Mobile full-screen sheet and Add behavior.

