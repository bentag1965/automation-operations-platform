create extension if not exists pgcrypto;

create table if not exists workflows (
    id uuid primary key default gen_random_uuid(),
    idempotency_key text not null unique,
    workflow_type text not null,
    source text not null,
    status text not null check (
        status in (
            'received',
            'validated',
            'queued',
            'processing',
            'awaiting_approval',
            'retry_scheduled',
            'succeeded',
            'failed',
            'dead_letter',
            'cancelled'
        )
    ),
    payload jsonb not null,
    result jsonb,
    attempt_count integer not null default 0,
    max_attempts integer not null default 5,
    approval_required boolean not null default false,
    next_attempt_at timestamptz,
    last_error_code text,
    last_error_message text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    completed_at timestamptz
);

create table if not exists workflow_events (
    id uuid primary key default gen_random_uuid(),
    workflow_id uuid not null references workflows(id),
    event_type text not null,
    from_status text,
    to_status text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create table if not exists approvals (
    id uuid primary key default gen_random_uuid(),
    workflow_id uuid not null references workflows(id),
    status text not null check (status in ('pending','approved','rejected')),
    requested_at timestamptz not null default now(),
    decided_at timestamptz,
    decided_by text,
    note text
);

create index if not exists idx_workflows_status on workflows(status);
create index if not exists idx_workflows_next_attempt on workflows(next_attempt_at);
create index if not exists idx_workflow_events_workflow on workflow_events(workflow_id);
create index if not exists idx_approvals_workflow on approvals(workflow_id);
