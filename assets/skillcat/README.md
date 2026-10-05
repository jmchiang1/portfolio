# SkillCat case study — media assets

The case study (`skillcat.html`) embeds native `<video>` players whose `src`/`poster`
paths point here. The page renders a labeled placeholder for any file that doesn't
exist yet, so you can drop these in one at a time and they'll light up automatically.

Record from the running prototype, then save with these exact names (paths are
referenced verbatim in `skillcat.html` — keep them or update both places):

| Section | Video file | Poster (first frame) | What it shows |
|---------|-----------|----------------------|---------------|
| Learner · Flow 1 | `Add-Course.mp4` | `poster-add-course.jpg` | Add a course: home → course-overview (Summary, Preview) → Add Certification → "All Set" → path |
| Learner · Flow 2 | `Complete-Task.mp4` | `poster-complete-task.jpg` | Start a lesson: home → path → lesson sheet → video lesson → "That's a Win" → path |
| Learner · Flow 3 | `Start-Exam.mp4` | `poster-start-exam.jpg` | Start EPA 608 exam: path → intro → camera → ID photo/submit → video + camera check → cert email → rules → tips → loading |
| Learner · Flow 4 | `Complete-Exam.mp4` | `poster-complete-exam.jpg` | Take & pass the exam: all 9 question types under proctoring → submit → "You Passed!" → results |
| Learner · Flow 5 | `Get-EPACard.mp4` | `poster-get-epacard.jpg` | Get the EPA card: "You Passed!" → certificates → EPA 608 detail → Add to Digital Wallet → order status |
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
- The five learner clips are 860×1864 (2× the 430×932 phone screen), recorded from the live web prototype
  (https://skillcat-mobile-app.vercel.app) in its desktop device frame and cropped to the screen; the two admin clips are desktop/~16:10.
- The hero currently reuses `assets/skillcat-mockup.png`. Swap it in `skillcat.html`
  (`.cs-hero-image img`) if you'd rather lead with a different frame.
