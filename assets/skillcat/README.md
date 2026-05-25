# SkillCat case study — media assets

The case study (`skillcat.html`) embeds native `<video>` players whose `src`/`poster`
paths point here. The page renders a labeled placeholder for any file that doesn't
exist yet, so you can drop these in one at a time and they'll light up automatically.

Record from the running prototype, then save with these exact names (paths are
referenced verbatim in `skillcat.html` — keep them or update both places):

| Section | Video file | Poster (first frame) | What it shows |
|---------|-----------|----------------------|---------------|
| Learner · Flow 1 | `Add-Course.mp4` | `poster-add-course.jpg` | Add a course: catalog → course-overview (Add Course) → "All Set" → path |
| Learner · Flow 2 | `Complete-Task.mp4` | `poster-complete-task.jpg` | Start a lesson & complete a task: path → lesson (video/PDF) → "Task Complete" |
| Learner · Flow 3 | `Start-Exam.mp4` | `poster-start-exam.jpg` | Start EPA 608 exam: intro → rules → tips → camera / scan ID / face scan |
| Learner · Flow 4 | `Complete-Exam.mp4` | `poster-complete-exam.jpg` | Take & pass the exam: questions (MC + tool-match) under proctoring → pass result |
| Learner · Flow 5 | `Get-EPACard.mp4` | `poster-get-epacard.jpg` | Get the EPA card: certification-detail → Order Card → email delivery → Add to Wallet |
| Admin · A | `walkthrough-assign-training.mp4` | `poster-assign-training.jpg` | Admin: select people → build & reorder plan w/ per-course due dates → review & assign |
| Admin · B | `walkthrough-people-bulk-actions.mp4` | `poster-people-bulk-actions.jpg` | People tab, the Assign shortcut, and the Message composer |
| Craft | `badge-completion.mp4` | `poster-badge-completion.jpg` | Badge reward: idle → energy build → flash burst → spring in → settle (autoplays, loops) |
| Specs | `spec-sample.png` | — | A static screenshot/excerpt of a real spec doc (optional) |

## Notes
- Mobile clips are framed in a phone aspect ratio; desktop clips in ~16:10. Record at
  a matching aspect to avoid letterboxing.
- `.mp4` (H.264 + AAC) plays everywhere. ~30–60s, no audio needed.
- Big video files should be tracked with Git LFS. Add a line to `.gitattributes`, e.g.
  `assets/skillcat/*.mp4 filter=lfs diff=lfs merge=lfs -text`, before committing them.
- The five learner clips are mobile/phone-framed (430×930); the two admin clips are desktop/~16:10.
- The hero currently reuses `assets/skillcat-mockup.png`. Swap it in `skillcat.html`
  (`.cs-hero-image img`) if you'd rather lead with a different frame.
