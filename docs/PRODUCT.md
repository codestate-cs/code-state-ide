# CodeState Product Overview

## What is CodeState?

CodeState is a productivity tool designed to help developers and technical teams capture, save, and restore their entire working context with a single command. It enables users to take a "snapshot" of their development environment—including open files, terminal sessions, project state, and even git branches—so they can pause work at any moment and later resume exactly where they left off, with full continuity and minimal friction.

## Who Is It For?

- **Developers** who frequently switch between tasks, features, or projects and want to avoid losing context.
- **Teams** that need to hand off work, onboard new members, or support asynchronous collaboration.
- **Anyone** who wants to reduce the cognitive load of remembering what they were doing, especially after interruptions, meetings, or context switches.

## Key Features

- **Session Save & Resume:** Instantly save your current development session (including open files, and project state) and resume it later with a single command.
- **Context Snapshot:** Capture the exact state of your work, including notes and tags for easy searching and filtering.
- **Seamless Git Integration:** Automatically records the current branch, commit, and optionally stashes uncommitted changes to ensure a clean, restorable state.
- **Terminal Process Pickup:** Restores terminal sessions and commands, so you can pick up running processes or development servers without manual setup.
- **Session Timeline & Search:** List, search, and filter past sessions by name, tag, or recency. Visualize your work history and quickly jump to any previous state.
- **Portable Session Export:** Export and import session files for sharing, onboarding, or debugging across teams and machines.
- **Interactive & Scriptable:** Use interactively (with prompts) or fully scriptable for automation and CI/CD workflows.
- **Configurable & Extensible:** Customize session details, storage, and integrations to fit your workflow. Designed for future plugin and extension support.

## Typical User Journey

1. **Start Working:** Begin coding, open files, run terminals based on commands saved, and make changes as usual.
2. **Save a Session:** When you want to pause, switch tasks, or capture your progress, run `codestate save <session-name>`. Optionally add a note or tags.
3. **Context Captured:** CodeState records your open files, terminal sessions, git state, and any notes/tags, creating a restorable snapshot.
4. **Switch Tasks or Take a Break:** Move to another project, shut down, or step away—no need to remember what you were doing.
5. **Resume Work:** When ready, run `codestate resume <session-name>`. CodeState restores your environment: switches to the correct git branch, reopens files, restarts terminals based on commands saved, and shows a summary of where you left off.
6. **Review & Manage Sessions:** Use `codestate list` to browse, search, and manage all your saved sessions. Export or share sessions as needed.

## Value Proposition

- **Eliminate Context Loss:** Never lose track of what you were doing, even after long interruptions or switching between multiple projects.
- **Accelerate Onboarding & Handoffs:** New team members or collaborators can instantly pick up where someone else left off, with full context and minimal setup.
- **Reduce Cognitive Load:** Free your mind from remembering details about your work-in-progress. Let CodeState handle the details so you can focus on problem-solving.
- **Boost Productivity:** Spend less time setting up, retracing steps, or recovering lost work. Get back to a productive state instantly.
- **Enable True Async Collaboration:** Share portable session files for seamless handoffs, code reviews, or support scenarios.

---

CodeState is your "save game" button for development, making deep work, collaboration, and context switching effortless and reliable. 