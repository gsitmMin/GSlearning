-- =====================================================================
-- V1: 초기 스키마 — PRD §8 (18개 테이블)
-- 상태값은 varchar + CHECK (PRD §8), updated_at은 트리거 갱신 (FR-X-04)
-- =====================================================================

CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 조직 · 직원 · 인증 ─────────────────────────────────────────────

CREATE TABLE organization (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        VARCHAR(40)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  parent_id   BIGINT REFERENCES organization(id),
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- employee: HR가 Source of Truth (지금은 수동 등록, source로 구분)
-- employee_no는 향후 HR 연동의 매칭 키 (자연키)
CREATE TABLE employee (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_no       VARCHAR(30)  NOT NULL UNIQUE,
  name              VARCHAR(60)  NOT NULL,
  email             VARCHAR(255) NOT NULL UNIQUE,
  organization_id   BIGINT       NOT NULL REFERENCES organization(id),
  manager_id        BIGINT REFERENCES employee(id),
  position          VARCHAR(60),
  employment_status VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                    CHECK (employment_status IN ('ACTIVE','LEAVE','RESIGNED')),
  hired_on          DATE,
  source            VARCHAR(10)  NOT NULL DEFAULT 'MANUAL'
                    CHECK (source IN ('MANUAL','HR')),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_employee_org ON employee(organization_id);

-- 자격증명은 employee와 분리 (HR 동기화가 employee를 덮어써도 영향 없음,
-- 그룹웨어 SSO 전환 시 이 테이블만 무력화)
CREATE TABLE user_account (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_id          BIGINT      NOT NULL UNIQUE REFERENCES employee(id),
  password_hash        VARCHAR(100) NOT NULL,
  must_change_password BOOLEAN     NOT NULL DEFAULT true,
  enabled              BOOLEAN     NOT NULL DEFAULT true,
  last_login_at        TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_role (
  user_account_id BIGINT      NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('LEARNER','ADMIN')),
  PRIMARY KEY (user_account_id, role)
);

-- Refresh Token은 해시로만 저장, 로그아웃 시 폐기 (FR-A-02/06)
CREATE TABLE user_refresh_token (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_account_id BIGINT      NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
  token_hash      VARCHAR(64) NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_account ON user_refresh_token(user_account_id);

-- ── 콘텐츠 ────────────────────────────────────────────────────────

-- content.code(CONT-001 형태)가 API 노출 식별자, Vimeo ID는 video_asset에 (§12 확장훅 1)
CREATE TABLE learning_content (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code                VARCHAR(30)  NOT NULL UNIQUE,
  source_type         VARCHAR(20)  NOT NULL DEFAULT 'INTERNAL_VIMEO'
                      CHECK (source_type IN ('INTERNAL_VIMEO')),
  title               VARCHAR(200) NOT NULL,
  description         TEXT         NOT NULL DEFAULT '',
  duration_sec        INT          NOT NULL CHECK (duration_sec > 0),
  language            VARCHAR(10)  NOT NULL DEFAULT 'ko',
  difficulty          VARCHAR(10)  NOT NULL DEFAULT '입문'
                      CHECK (difficulty IN ('입문','초급','중급','고급')),
  publish_status      VARCHAR(15)  NOT NULL DEFAULT 'DRAFT'
                      CHECK (publish_status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  availability_status VARCHAR(15)  NOT NULL DEFAULT 'AVAILABLE'
                      CHECK (availability_status IN ('AVAILABLE','REMOVED')),
  created_by          BIGINT REFERENCES employee(id),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_content_publish ON learning_content(publish_status, availability_status);

CREATE TABLE video_asset (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_id        BIGINT      NOT NULL UNIQUE REFERENCES learning_content(id) ON DELETE CASCADE,
  provider          VARCHAR(20) NOT NULL DEFAULT 'VIMEO' CHECK (provider IN ('VIMEO')),
  provider_video_id VARCHAR(40) NOT NULL,
  embed_hash        VARCHAR(60),
  thumbnail_url     VARCHAR(500),
  download_enabled  BOOLEAN     NOT NULL DEFAULT false,
  raw_metadata      JSONB,
  synced_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_video_id)
);

CREATE TABLE content_segment (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_id  BIGINT       NOT NULL REFERENCES learning_content(id) ON DELETE CASCADE,
  sequence_no INT          NOT NULL,
  start_sec   INT          NOT NULL CHECK (start_sec >= 0),
  end_sec     INT          NOT NULL,
  title       VARCHAR(200) NOT NULL,
  summary     VARCHAR(500),
  created_by  BIGINT REFERENCES employee(id),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CHECK (end_sec > start_sec),
  UNIQUE (content_id, sequence_no) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX idx_segment_content ON content_segment(content_id);

CREATE TABLE transcript (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_id BIGINT      NOT NULL REFERENCES learning_content(id) ON DELETE CASCADE,
  kind       VARCHAR(20) NOT NULL CHECK (kind IN ('RAW','CLEAN','HUMAN_REVIEWED')),
  language   VARCHAR(10) NOT NULL DEFAULT 'ko',
  source     VARCHAR(10) NOT NULL CHECK (source IN ('CAPTION','MANUAL','STT')),
  body       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transcript_content ON transcript(content_id);

-- 접근범위: ALL(전사) / ORGANIZATION(부서) / EXPLICIT(개인) — PRD ACL 3단계
CREATE TABLE content_access (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_id      BIGINT      NOT NULL REFERENCES learning_content(id) ON DELETE CASCADE,
  scope           VARCHAR(15) NOT NULL CHECK (scope IN ('ALL','ORGANIZATION','EXPLICIT')),
  organization_id BIGINT REFERENCES organization(id),
  employee_id     BIGINT REFERENCES employee(id),
  CHECK (
    (scope = 'ALL'          AND organization_id IS NULL AND employee_id IS NULL) OR
    (scope = 'ORGANIZATION' AND organization_id IS NOT NULL AND employee_id IS NULL) OR
    (scope = 'EXPLICIT'     AND organization_id IS NULL AND employee_id IS NOT NULL)
  )
);
CREATE INDEX idx_access_content ON content_access(content_id);

-- ── 과정 · 수강 ────────────────────────────────────────────────────

CREATE TABLE course (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code           VARCHAR(30)  NOT NULL UNIQUE,
  title          VARCHAR(200) NOT NULL,
  description    TEXT         NOT NULL DEFAULT '',
  mandatory      BOOLEAN      NOT NULL DEFAULT false,
  publish_status VARCHAR(15)  NOT NULL DEFAULT 'DRAFT'
                 CHECK (publish_status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE course_module (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id   BIGINT       NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  sequence_no INT          NOT NULL,
  title       VARCHAR(200) NOT NULL,
  UNIQUE (course_id, sequence_no) DEFERRABLE INITIALLY DEFERRED
);

-- item_type은 지금 VIDEO뿐이지만 자료·과제 확장 대비 (§12 확장훅 11)
CREATE TABLE learning_item (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_module_id     BIGINT      NOT NULL REFERENCES course_module(id) ON DELETE CASCADE,
  sequence_no          INT         NOT NULL,
  item_type            VARCHAR(15) NOT NULL DEFAULT 'VIDEO' CHECK (item_type IN ('VIDEO')),
  content_id           BIGINT      NOT NULL REFERENCES learning_content(id),
  required             BOOLEAN     NOT NULL DEFAULT true,
  min_progress_percent INT         NOT NULL DEFAULT 90
                       CHECK (min_progress_percent BETWEEN 1 AND 100),
  UNIQUE (course_module_id, sequence_no) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX idx_item_content ON learning_item(content_id);

CREATE TABLE enrollment (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id    BIGINT      NOT NULL REFERENCES course(id),
  employee_id  BIGINT      NOT NULL REFERENCES employee(id),
  status       VARCHAR(15) NOT NULL DEFAULT 'ENROLLED'
               CHECK (status IN ('ENROLLED','IN_PROGRESS','COMPLETED')),
  assigned_by  BIGINT REFERENCES employee(id),
  due_on       DATE,
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, employee_id)
);
CREATE INDEX idx_enrollment_employee ON enrollment(employee_id);

CREATE TABLE learning_item_completion (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  enrollment_id    BIGINT      NOT NULL REFERENCES enrollment(id) ON DELETE CASCADE,
  learning_item_id BIGINT      NOT NULL REFERENCES learning_item(id),
  completed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, learning_item_id)
);

-- ── 진도 (PRD §7) ─────────────────────────────────────────────────

CREATE TABLE video_progress (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_id      BIGINT        NOT NULL REFERENCES employee(id),
  content_id       BIGINT        NOT NULL REFERENCES learning_content(id),
  watched_sec      INT           NOT NULL DEFAULT 0,
  progress_percent NUMERIC(5,1)  NOT NULL DEFAULT 0,
  last_position_sec INT          NOT NULL DEFAULT 0,
  completed        BOOLEAN       NOT NULL DEFAULT false,
  first_started_at TIMESTAMPTZ,
  last_watched_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (employee_id, content_id)
);
CREATE INDEX idx_progress_employee ON video_progress(employee_id);

-- 실제 시청 구간 (병합 결과만 저장, 최대 500행/진도 — §7.3)
CREATE TABLE video_progress_interval (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  video_progress_id BIGINT        NOT NULL REFERENCES video_progress(id) ON DELETE CASCADE,
  start_sec         NUMERIC(9,2)  NOT NULL CHECK (start_sec >= 0),
  end_sec           NUMERIC(9,2)  NOT NULL,
  CHECK (end_sec > start_sec)
);
CREATE INDEX idx_interval_progress ON video_progress_interval(video_progress_id);

-- ── 감사 (FR-X-01) ────────────────────────────────────────────────

CREATE TABLE audit_log (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_account_id  BIGINT,
  actor_employee_no VARCHAR(30),
  action            VARCHAR(60) NOT NULL,
  entity_type       VARCHAR(40),
  entity_id         VARCHAR(40),
  detail            JSONB,
  ip                VARCHAR(45),
  user_agent        VARCHAR(300),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_created ON audit_log(created_at);
CREATE INDEX idx_audit_action ON audit_log(action, created_at);

-- ── updated_at 트리거 일괄 적용 ────────────────────────────────────
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organization','employee','user_account','learning_content','video_asset',
    'content_segment','course','enrollment','video_progress'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t);
  END LOOP;
END $$;
