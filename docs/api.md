# API contract v0 (draft)

Status: draft for review, issue #58. Not agreed yet.
Owners: Derek (backend routes), Juan (frontend). Last updated Nov 16, 2026.

This is the one place that says what the web app sends and what the backend returns. Anything marked **proposed** is a suggestion that needs a yes from Derek. The questions at the bottom are the ones that block backend work.

All example values are invented. This repo is public, so examples never contain real lecture text.

## Routes at a glance

| Method | Path | What it does |
|---|---|---|
| GET | `/api/courses` | List my courses |
| POST | `/api/courses` | Create a course from a typed name |
| GET | `/api/courses/{courseId}/lectures` | List the lectures in a course |
| POST | `/api/lectures` | Start an upload and get a signed upload URL |
| POST | `/api/lectures/{lectureId}/complete` | Say the upload finished and start transcription |
| GET | `/api/lectures/{lectureId}` | Get one lecture and its status |
| GET | `/api/lectures/{lectureId}/transcript` | Get the transcript (the #55 format) |
| POST | `/api/lectures/{lectureId}/ask` | Ask a question (returns the #8 answer format) |
| DELETE | `/api/lectures/{lectureId}` | Delete a lecture and everything made from it |

Sign-in routes live under `/api/auth/*` and belong to Better Auth. See the next section.

## Conventions

- **Where routes run.** Not decided. Hosting is on the agenda for the Nov 19 sync (open question 12). The routes are designed to work either as Next.js route handlers under `apps/web/src/app/api/` or as Lambda functions behind the same paths. To keep that true, the contract uses only plain HTTP: a method, a path, a JSON body, a status code and the session cookie. Nothing relies on a Next.js-only feature such as server actions.
- **Same origin.** The browser always calls `/api/...` on the web app's own origin. If the routes move to Lambda, the web app's host forwards `/api/*` to them, so the session cookie still arrives and the web app does not change.
- **Format.** JSON in and out, UTF-8, `Content-Type: application/json`. Field names are camelCase. Unknown request fields are ignored.
- **Ids.** Opaque strings. Clients never parse them or build them. The ids in the examples are made up and do not imply a format.
- **Times.** Timestamps are ISO 8601 in UTC (`2026-11-16T19:02:11Z`). Lengths and positions in a recording are in seconds.
- **Ownership.** A user only ever sees their own courses and lectures. Asking for someone else's returns `404`, the same as one that does not exist.
- **GET never changes data.** Only POST and DELETE do.
- **No pagination in v0.** A pilot user has a handful of courses and a few dozen lectures. List responses are wrapped in an object (`{ "courses": [...] }`) so paging can be added later without a breaking change.

## Signing in, and how the user id reaches a route

Sign-in is Better Auth with Google (decided in #54). Google only for the pilot, so there are no passwords.

Better Auth is mounted at `/api/auth/*` with one catch-all route handler. It owns those routes and this doc does not redefine them. The web app reaches them through the Better Auth client, never by hand:

| What the app does | Better Auth route behind it |
|---|---|
| Start Google sign-in | `POST /api/auth/sign-in/social` |
| Google sends the user back | `GET /api/auth/callback/google` |
| Read the current session | `GET /api/auth/get-session` |
| Sign out | `POST /api/auth/sign-out` |

**The session is a cookie.** After sign-in, Better Auth sets an HTTP-only session cookie. The browser sends it on every same-origin request, so the web app adds nothing: no `Authorization` header, and no user id in a URL, query string or body.

**Each route handler reads the user id from the session, on the server:**

```ts
// Sketch. File names and the helper are up to Derek.
// getSession only needs the request headers, so the same check works in a
// Next.js route handler or in a Lambda that shares the auth config and database.
const session = await auth.api.getSession({ headers: request.headers });
if (!session) {
  return Response.json(
    { error: { code: "unauthenticated", message: "Sign in first." } },
    { status: 401 },
  );
}
const userId = session.user.id;
```

Rules that follow from this:

1. Every route in this doc needs a session and returns `401 unauthenticated` without one.
2. The user id only ever comes from the session. No route accepts a `userId` from the client.
3. Every database query filters by that user id, and every S3 key starts with `users/{userId}/`.
4. Next.js 16's `proxy.ts` may redirect signed-out visitors to `/login`, but it is not the security check. A cookie that merely exists proves nothing. The check is the `getSession` call inside each route handler.

How the user id reaches the retrieval Lambda is open question 1.

## Errors

Every error uses the same shape:

```json
{ "error": { "code": "lecture_not_ready", "message": "This lecture is still being transcribed." } }
```

`code` is stable and is what the web app switches on. `message` is plain English for logs and debugging; the web app writes its own user-facing text.

Errors any route can return:

| Status | Code | When |
|---|---|---|
| 400 | `invalid_request` | The body is not valid JSON, or a field is missing or out of range |
| 401 | `unauthenticated` | No session, or it expired |
| 404 | `not_found` | No such course or lecture, or it belongs to someone else |
| 500 | `internal_error` | Anything unexpected on our side |

Route-specific errors are listed with each route.

## Courses

A course is a name the user typed. Each lecture belongs to exactly one course.

```json
{
  "id": "crs_4f9a2c",
  "name": "Calculus III",
  "lectureCount": 3,
  "createdAt": "2026-11-10T17:30:00Z"
}
```

### List my courses

`GET /api/courses`

- **Auth:** required.
- **Request:** no parameters, no body.
- **Response:** `200 OK`. Sorted by name, A to Z. An empty list is a normal response.

```json
{ "courses": [ { "id": "crs_4f9a2c", "name": "Calculus III", "lectureCount": 3, "createdAt": "2026-11-10T17:30:00Z" } ] }
```

- **Errors:** `401 unauthenticated`.

### Create a course

`POST /api/courses`

- **Auth:** required.
- **Request:** `name` is trimmed, then must be 1 to 100 characters.

```json
{ "name": "Calculus III" }
```

- **Response:** `201 Created` with the new course (`lectureCount` is 0).

```json
{ "course": { "id": "crs_4f9a2c", "name": "Calculus III", "lectureCount": 0, "createdAt": "2026-11-16T19:00:00Z" } }
```

- **Errors:**

| Status | Code | When |
|---|---|---|
| 400 | `invalid_request` | `name` is missing, empty after trimming, or over 100 characters |
| 401 | `unauthenticated` | No session |
| 409 | `course_name_taken` | The user already has a course with this name, ignoring case (**proposed**) |

## Lectures

```json
{
  "id": "lec_7b21e0",
  "courseId": "crs_4f9a2c",
  "title": "Week 9: Triple integrals",
  "mediaType": "audio",
  "contentType": "audio/mp4",
  "sizeBytes": 48211032,
  "durationSeconds": 2967,
  "status": "ready",
  "failure": null,
  "createdAt": "2026-11-16T19:02:11Z",
  "updatedAt": "2026-11-16T19:09:40Z"
}
```

- `mediaType` is `"audio"` or `"video"`.
- `durationSeconds` is `null` until transcription has measured it.
- `failure` is `null` unless `status` is `"failed"`. Then it is `{ "code": "...", "message": "..." }`, with `code` one of `file_rejected` or `transcription_failed`.

### Status

| `status` | Meaning | Can move to |
|---|---|---|
| `uploading` | The lecture exists, but we have not confirmed the file is in S3 | `transcribing`, `failed` |
| `transcribing` | The file is in S3. Speech-to-text and indexing are running | `ready`, `failed` |
| `ready` | The transcript and index exist. Questions can be asked | (none) |
| `failed` | Something went wrong. See `failure`. The user can delete it and upload again | (none) |

The web app learns about status changes by polling `GET /api/lectures/{lectureId}` every 5 seconds while the status is `uploading` or `transcribing` (**proposed**, open question 3).

### List the lectures in a course

`GET /api/courses/{courseId}/lectures`

- **Auth:** required.
- **Request:** no parameters, no body.
- **Response:** `200 OK`. Newest first, every status included. An empty list is a normal response.

```json
{ "lectures": [ { "id": "lec_7b21e0", "courseId": "crs_4f9a2c", "title": "Week 9: Triple integrals", "mediaType": "audio", "contentType": "audio/mp4", "sizeBytes": 48211032, "durationSeconds": 2967, "status": "ready", "failure": null, "createdAt": "2026-11-16T19:02:11Z", "updatedAt": "2026-11-16T19:09:40Z" } ] }
```

- **Errors:** `401 unauthenticated`, `404 not_found` (no such course for this user).

### Get one lecture and its status

`GET /api/lectures/{lectureId}`

- **Auth:** required.
- **Request:** no parameters, no body.
- **Response:** `200 OK` with the lecture, plus a short-lived link the lecture page uses to play the recording.

```json
{
  "lecture": { "id": "lec_7b21e0", "status": "ready", "...": "the full lecture object" },
  "playback": {
    "url": "https://<bucket>.s3.<region>.amazonaws.com/users/<userId>/lectures/<lectureId>/original?X-Amz-Signature=...",
    "expiresAt": "2026-11-16T23:02:11Z"
  }
}
```

`playback` is `null` while the status is `uploading`. It is **proposed** and was not in the #58 comment: the bucket is private, so the lecture page has no other way to play the file or jump to a citation. See open question 8.

- **Errors:** `401 unauthenticated`, `404 not_found`.

### Delete a lecture

`DELETE /api/lectures/{lectureId}`

Deletes the recording in S3, the transcript, the search index entries and the database row. Allowed in any status. The "are you sure?" step is the web app's job, so this route takes no confirm flag.

- **Auth:** required.
- **Request:** no body.
- **Response:** `204 No Content`. After that the lecture is gone from every list, and a second delete returns `404`.
- **Errors:** `401 unauthenticated`, `404 not_found`.

What "deleted" means for a lecture that is still transcribing is open question 6.

## Uploading a lecture (video or audio)

**Recommended: the browser uploads straight to S3 with a presigned PUT URL.** The file never passes through our server, which matters because lecture videos run to hundreds of megabytes and most serverless hosts cap a request body at a few megabytes.

The flow is three steps, and it is the same for video and audio:

1. The web app calls `POST /api/lectures` with the file's details. The server checks them, creates the lecture as `uploading`, and returns a signed URL.
2. The browser sends the file to that URL with `PUT`. This request goes to S3, not to us.
3. The web app calls `POST /api/lectures/{lectureId}/complete`. The server checks the file really is in S3, then starts transcription.

There is no resume in v0. If step 2 fails, the web app deletes the lecture and starts again.

### Limits (all proposed, open question 2)

| Limit | Value | Why |
|---|---|---|
| Audio types | `audio/mpeg` (.mp3), `audio/mp4` or `audio/x-m4a` (.m4a), `audio/wav` or `audio/x-wav` (.wav) | Named in Deepgram's supported formats. Browsers disagree on the m4a and wav names, so both are accepted |
| Video types | `video/mp4` (.mp4), `video/webm` (.webm) | Same list. `.mov` is not named there, so it is left out until tested |
| Largest file | 2 GB | Deepgram's limit for one file. Also under S3's 5 GB limit for one PUT |
| Upload URL lifetime | 15 minutes | S3 checks the expiry when the upload starts, so a slow upload that started in time still finishes |

### Start an upload

`POST /api/lectures`

- **Auth:** required.
- **Request:**

```json
{
  "courseId": "crs_4f9a2c",
  "title": "Week 9: Triple integrals",
  "mediaType": "audio",
  "contentType": "audio/mp4",
  "sizeBytes": 48211032,
  "rightsConfirmed": true
}
```

| Field | Rules |
|---|---|
| `courseId` | One of the user's courses |
| `title` | Trimmed, 1 to 200 characters. The web app pre-fills it from the file name |
| `mediaType` | `"audio"` or `"video"`, and it must agree with `contentType` |
| `contentType` | One of the types in the limits table |
| `sizeBytes` | A whole number from 1 up to the size limit |
| `rightsConfirmed` | Must be `true`. It is the upload page's "I have the right to upload this recording" checkbox. The server stores when it was ticked (**proposed**, not in the #58 comment, open question 9) |

- **Response:** `201 Created`.

```json
{
  "lecture": { "id": "lec_7b21e0", "status": "uploading", "...": "the full lecture object" },
  "upload": {
    "method": "PUT",
    "url": "https://<bucket>.s3.<region>.amazonaws.com/users/<userId>/lectures/<lectureId>/original?X-Amz-Signature=...",
    "headers": { "Content-Type": "audio/mp4" },
    "expiresAt": "2026-11-16T19:17:11Z"
  }
}
```

The browser must send exactly the headers in `upload.headers`, or S3 rejects the signature. That is why the response spells them out. (The #58 comment sketched this response as `{ lectureId, uploadUrl }`; those are now `lecture.id` and `upload.url`.)

- **Errors:**

| Status | Code | When |
|---|---|---|
| 400 | `invalid_request` | A field is missing or breaks a rule above |
| 400 | `rights_not_confirmed` | `rightsConfirmed` is not `true` |
| 400 | `unsupported_file_type` | `contentType` is not on the list, or disagrees with `mediaType` |
| 400 | `file_too_large` | `sizeBytes` is over the limit |
| 401 | `unauthenticated` | No session |
| 404 | `not_found` | No such course for this user |

### Send the file to S3

`PUT {upload.url}` with the headers from `upload.headers` and the raw file as the body. This is S3's API, not ours: it returns `200` with an empty body on success and an XML error otherwise. It needs no session cookie, because the signature in the URL is the permission. The bucket needs a CORS rule that allows `PUT` from the web app's origins.

### Finish an upload

`POST /api/lectures/{lectureId}/complete`

- **Auth:** required.
- **Request:** no body.
- **Response:** `200 OK` with the lecture, now `transcribing`. The server first checks that the object exists in S3 and that its size and type match what was declared. Calling this again on a lecture that is already past `uploading` returns `200` with the lecture as it is, so a retry after a dropped connection is safe.

```json
{ "lecture": { "id": "lec_7b21e0", "status": "transcribing", "...": "the full lecture object" } }
```

- **Errors:**

| Status | Code | When |
|---|---|---|
| 400 | `file_rejected` | The object in S3 does not match the declared size or type. The server deletes the object and marks the lecture `failed` |
| 401 | `unauthenticated` | No session |
| 404 | `not_found` | No such lecture for this user |
| 409 | `upload_incomplete` | There is no object in S3 yet. The lecture stays `uploading` |

### Alternatives to presigned PUT

| Option | Good | Bad | Verdict |
|---|---|---|---|
| **Presigned PUT** (recommended) | One request. Simple in the browser and on the server. Up to 5 GB | No resume. S3 does not enforce a size cap by itself, so `/complete` checks afterwards | Use for v0 |
| Presigned POST (form upload) | S3 itself enforces the size range and content type, so a bad file is refused before it is stored | Multipart form with signed fields, a little more code on both sides. No resume | The fallback if checking after the fact is not enough (open question 5) |
| S3 multipart upload with a signed URL per part | Resumable, parts upload in parallel, no 5 GB limit | Four routes instead of two (start, sign parts, complete, abort), and much more browser code | Later, if big videos fail on campus Wi-Fi |
| Upload through our own route handler | Easiest for the browser. The server sees the bytes | Serverless hosts cap request bodies at a few MB (4.5 MB on Vercel functions, 6 MB into a Lambda, 10 MB through API Gateway). Needs an always-on server | Ruled out, and it would lock in the hosting choice |
| A hosted upload service (for example tus, UploadThing or Mux) | Resume and progress built in | Another vendor, another bill, and lecture files leave our S3 | Ruled out for the pilot |

## Transcript

`GET /api/lectures/{lectureId}/transcript`

Listed in #58, so it is here for completeness. The lecture page uses it for the transcript view.

- **Auth:** required.
- **Request:** no parameters, no body.
- **Response:** `200 OK`. The body is a transcript exactly as defined in `docs/transcript-format/` (#55, not merged yet). This doc does not restate that format, and the route handler does not reshape it.
- **Errors:**

| Status | Code | When |
|---|---|---|
| 401 | `unauthenticated` | No session |
| 404 | `not_found` | No such lecture for this user |
| 409 | `lecture_not_ready` | The lecture's status is not `ready` |

## Asking a question about a lecture

`POST /api/lectures/{lectureId}/ask`

A question is always about one lecture.

- **Auth:** required.
- **Request:** `question` is trimmed, then must be 1 to 500 characters (**proposed**).

```json
{ "question": "How do I choose the order of integration?" }
```

- **Response:** `200 OK`. The body is an answer exactly as defined in `docs/answer-format/` (schema pending Preston's #8 PR). This doc does not restate that format, and the route handler passes it through unchanged. "No answer found" is a normal `200` in that format, not an error.
- **Errors:**

| Status | Code | When |
|---|---|---|
| 400 | `invalid_request` | `question` is missing, empty after trimming, or too long |
| 401 | `unauthenticated` | No session |
| 404 | `not_found` | No such lecture for this user |
| 409 | `lecture_not_ready` | The lecture's status is not `ready` |
| 429 | `rate_limited` | Too many questions in a short time. Comes with a `Retry-After` header (**proposed**, open question 7) |
| 502 | `upstream_error` | The retrieval service failed |
| 504 | `upstream_timeout` | The retrieval service took too long |

## Not in v0

- Renaming or deleting a course, and renaming or moving a lecture
- Retrying a failed lecture (delete it and upload again)
- Resumable uploads
- Earlier questions for a lecture. The demo lecture pages show them, so a history route is the likely first addition
- Questions across a whole course
- Streaming answers
- Deleting an account and all its data
- Any sign-in other than Google

## Open questions for Derek

Numbered so they can be answered by number. The first three are carried over from the #58 comment.

1. **Route handler to Lambda.** Do route handlers invoke Lambda directly with the AWS SDK, or go through API Gateway or a function URL? And how does Lambda know who is asking? Proposal: the route handler checks the session and ownership, then passes `userId` and `lectureId` in the payload. Lambda only accepts IAM-signed calls and never talks to the browser.
2. **Pilot limits.** Is 2 GB the right cap, and do we also cap length (for example 3 hours)? Are the five file types enough, and is `.mov` worth testing (phone recordings)?
3. **Status.** Is polling `GET /api/lectures/{lectureId}` every 5 seconds enough for v0? Is one `transcribing` status enough, or do you want a separate `indexing` step?
4. **Starting transcription.** Is the explicit `/complete` call right, or would you rather an S3 "object created" event start it? And for video: do we send the original file to Deepgram, or extract the audio first? Deepgram's docs suggest extracting audio from large videos, and its requests time out after 10 minutes.
5. **Enforcing the size cap.** Is the check in `/complete` enough, or do you want S3 to refuse oversized files up front (sign `Content-Length` into the PUT, or switch to presigned POST)?
6. **Delete.** Does `DELETE` remove everything before it answers, or hide the row first and clean up in the background? What happens to a transcription that is still running? Who removes lectures stuck in `uploading` after an abandoned upload (a daily sweep, or an S3 lifecycle rule)?
7. **Ask.** How long can an answer take, and what timeout should the web app expect? Do we want a per-user rate limit for the pilot to cap model cost? If the #8 format defines its own error cases, which shape wins for `/ask`? Proposal: HTTP errors use this doc's shape, and #8 only describes `200` responses. (This one is for Preston too.)
8. **Storage layout and playback.** Is `users/{userId}/lectures/{lectureId}/original`, with the transcript stored beside it, a layout you are happy with? Is a presigned GET in the lecture response fine for playback, and how long should it live? Seeking makes new requests, so it has to outlast a study session. Proposal: 4 hours, and the page re-fetches the lecture if playback fails. One catch: a URL signed with temporary AWS credentials stops working when those credentials expire (often after 1 hour), so the real lifetime depends on how the route handler gets its credentials.
9. **Rights checkbox.** Should the server store when the user confirmed their right to upload, or is the checkbox enough for the pilot?
10. **Local development.** How do upload and ask run on a laptop: a shared dev bucket, a local S3 stand-in, or mocked responses? The frontend builds against whichever you pick.
11. **Field names.** This doc uses camelCase. If the #8 and #55 formats use snake_case, the two pass-through responses will differ from the rest of the API. Is that fine, or should one side change?
12. **Hosting (decided at the Nov 19 sync).** Juan's preference is Vercel for the web app, with Lambda and S3 on AWS. Does that work for the backend? It changes three things here: whether these routes run as Next.js route handlers or as Lambda (the contract works for both), how the routes get AWS credentials for S3 and Lambda (questions 1 and 8), and the request time limit that `/ask` has to fit inside (question 7).
