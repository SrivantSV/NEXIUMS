-- ============================================================================
-- CONTENT INTEGRATION TABLES FOR NEXUS AI
-- Artifacts, Files, MCP Connections, Conversations, and Search
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "vector"; -- For embeddings (requires pgvector)

-- ============================================================================
-- ARTIFACTS SYSTEM
-- ============================================================================

-- Artifact types enum
CREATE TYPE artifact_type AS ENUM (
  'react-component', 'vue-component', 'svelte-component', 'angular-component',
  'html-page', 'javascript', 'typescript', 'python-script', 'node-script',
  'shell-script', 'sql-query', 'markdown-document', 'latex-document',
  'json-schema', 'api-spec', 'readme', 'data-table', 'chart', 'dashboard',
  'sql-results', 'csv-data', 'json-data', 'svg-graphic', 'mermaid-diagram',
  'flowchart', 'sequence-diagram', 'web-app', 'calculator', 'form'
);

-- Programming languages enum
CREATE TYPE programming_language AS ENUM (
  'javascript', 'typescript', 'python', 'html', 'css', 'jsx', 'tsx',
  'vue', 'svelte', 'sql', 'shell', 'markdown', 'json'
);

-- Execution status enum
CREATE TYPE execution_status AS ENUM (
  'pending', 'queued', 'running', 'completed', 'failed', 'timeout', 'cancelled'
);

-- Main artifacts table
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type artifact_type NOT NULL,
  language programming_language NOT NULL,
  content TEXT NOT NULL,
  dependencies TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artifact versions for history tracking
CREATE TABLE artifact_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  diff TEXT,
  message TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(artifact_id, version)
);

-- Code execution records
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status execution_status DEFAULT 'pending',
  output TEXT,
  error TEXT,
  exit_code INTEGER,
  stdout TEXT,
  stderr TEXT,
  duration INTEGER, -- milliseconds
  resource_usage JSONB,
  input JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- FILE HANDLING SYSTEM
-- ============================================================================

-- File category enum
CREATE TYPE file_category AS ENUM (
  'document', 'spreadsheet', 'presentation', 'image', 'audio',
  'video', 'code', 'data', 'design', 'archive', 'other'
);

-- File status enum
CREATE TYPE file_status AS ENUM (
  'uploading', 'processing', 'completed', 'failed'
);

-- Main files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  category file_category NOT NULL,
  extension VARCHAR(50) NOT NULL,
  storage_url TEXT NOT NULL,
  thumbnail_url TEXT,
  checksum VARCHAR(64) NOT NULL,
  text_content TEXT,
  status file_status DEFAULT 'processing',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File processing results
CREATE TABLE file_processing_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  processed_data JSONB,
  analysis JSONB,
  preview JSONB,
  security_scan JSONB,
  processing_time INTEGER, -- milliseconds
  status file_status DEFAULT 'processing',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File embeddings for semantic search
CREATE TABLE file_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI embedding dimension
  provider VARCHAR(50) DEFAULT 'openai',
  model VARCHAR(100) DEFAULT 'text-embedding-3-small',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MCP INTEGRATION FRAMEWORK
-- ============================================================================

-- MCP server categories
CREATE TYPE mcp_server_category AS ENUM (
  'productivity', 'communication', 'development', 'design', 'storage',
  'analytics', 'database', 'ai-ml', 'business', 'social', 'utilities'
);

-- MCP auth types
CREATE TYPE mcp_auth_type AS ENUM (
  'oauth', 'api-key', 'basic', 'custom', 'none'
);

-- MCP server configurations
CREATE TABLE mcp_servers (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,
  category mcp_server_category NOT NULL,
  icon TEXT,
  website TEXT,
  documentation TEXT,
  capabilities TEXT[] NOT NULL,
  auth_type mcp_auth_type NOT NULL,
  rate_limit JSONB,
  pricing JSONB,
  is_enterprise BOOLEAN DEFAULT FALSE,
  actions JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User's MCP connections
CREATE TABLE mcp_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  server_id VARCHAR(100) NOT NULL REFERENCES mcp_servers(id),
  server_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'connected',
  credentials JSONB NOT NULL, -- Encrypted credentials
  metadata JSONB DEFAULT '{}',
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, server_id)
);

-- MCP execution history
CREATE TABLE mcp_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES mcp_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  server_id VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  parameters JSONB,
  result JSONB,
  success BOOLEAN,
  error TEXT,
  duration INTEGER, -- milliseconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CHAT & CONVERSATIONS
-- ============================================================================

-- Message roles
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- Message content types
CREATE TYPE message_content_type AS ENUM (
  'text', 'artifact', 'file', 'mcp-result', 'execution-result'
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  model VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link artifacts to conversations
CREATE TABLE conversation_artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, artifact_id)
);

-- Link files to conversations
CREATE TABLE conversation_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, file_id)
);

-- Link MCP connections to conversations
CREATE TABLE conversation_mcp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES mcp_connections(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, connection_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Artifacts indexes
CREATE INDEX idx_artifacts_user_id ON artifacts(user_id);
CREATE INDEX idx_artifacts_type ON artifacts(type);
CREATE INDEX idx_artifacts_is_public ON artifacts(is_public);
CREATE INDEX idx_artifacts_created_at ON artifacts(created_at DESC);
CREATE INDEX idx_artifacts_tags ON artifacts USING GIN(tags);
CREATE INDEX idx_artifacts_search ON artifacts USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Artifact versions indexes
CREATE INDEX idx_artifact_versions_artifact_id ON artifact_versions(artifact_id);
CREATE INDEX idx_artifact_versions_version ON artifact_versions(version);

-- Executions indexes
CREATE INDEX idx_executions_artifact_id ON executions(artifact_id);
CREATE INDEX idx_executions_user_id ON executions(user_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_started_at ON executions(started_at DESC);

-- Files indexes
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_category ON files(category);
CREATE INDEX idx_files_status ON files(status);
CREATE INDEX idx_files_created_at ON files(created_at DESC);
CREATE INDEX idx_files_checksum ON files(checksum);
CREATE INDEX idx_files_search ON files USING GIN(to_tsvector('english', file_name || ' ' || COALESCE(text_content, '')));

-- File processing indexes
CREATE INDEX idx_file_processing_file_id ON file_processing_results(file_id);

-- File embeddings indexes
CREATE INDEX idx_file_embeddings_file_id ON file_embeddings(file_id);

-- MCP connections indexes
CREATE INDEX idx_mcp_connections_user_id ON mcp_connections(user_id);
CREATE INDEX idx_mcp_connections_server_id ON mcp_connections(server_id);
CREATE INDEX idx_mcp_connections_status ON mcp_connections(status);

-- MCP executions indexes
CREATE INDEX idx_mcp_executions_connection_id ON mcp_executions(connection_id);
CREATE INDEX idx_mcp_executions_user_id ON mcp_executions(user_id);
CREATE INDEX idx_mcp_executions_created_at ON mcp_executions(created_at DESC);

-- Conversations indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- Chat messages indexes
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_processing_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_mcp ENABLE ROW LEVEL SECURITY;

-- Artifacts policies
CREATE POLICY "Users can view own artifacts" ON artifacts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view public artifacts" ON artifacts
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can insert own artifacts" ON artifacts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own artifacts" ON artifacts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own artifacts" ON artifacts
  FOR DELETE USING (user_id = auth.uid());

-- Artifact versions policies
CREATE POLICY "Users can view artifact versions" ON artifact_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM artifacts
      WHERE artifacts.id = artifact_versions.artifact_id
      AND (artifacts.user_id = auth.uid() OR artifacts.is_public = TRUE)
    )
  );

CREATE POLICY "Users can insert artifact versions" ON artifact_versions
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Executions policies
CREATE POLICY "Users can view own executions" ON executions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own executions" ON executions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Files policies
CREATE POLICY "Users can view own files" ON files
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own files" ON files
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own files" ON files
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own files" ON files
  FOR DELETE USING (user_id = auth.uid());

-- File processing results policies
CREATE POLICY "Users can view file processing results" ON file_processing_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM files
      WHERE files.id = file_processing_results.file_id
      AND files.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert file processing results" ON file_processing_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM files
      WHERE files.id = file_processing_results.file_id
      AND files.user_id = auth.uid()
    )
  );

-- File embeddings policies
CREATE POLICY "Users can view file embeddings" ON file_embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM files
      WHERE files.id = file_embeddings.file_id
      AND files.user_id = auth.uid()
    )
  );

-- MCP connections policies
CREATE POLICY "Users can view own MCP connections" ON mcp_connections
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own MCP connections" ON mcp_connections
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own MCP connections" ON mcp_connections
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own MCP connections" ON mcp_connections
  FOR DELETE USING (user_id = auth.uid());

-- MCP executions policies
CREATE POLICY "Users can view own MCP executions" ON mcp_executions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own MCP executions" ON mcp_executions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (user_id = auth.uid());

-- Chat messages policies
CREATE POLICY "Users can view messages in own conversations" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = chat_messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own conversations" ON chat_messages
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Conversation links policies
CREATE POLICY "Users can view conversation artifacts" ON conversation_artifacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_artifacts.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view conversation files" ON conversation_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_files.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view conversation MCP" ON conversation_mcp
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_mcp.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON artifacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_connections_updated_at BEFORE UPDATE ON mcp_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create initial artifact version
CREATE OR REPLACE FUNCTION create_initial_artifact_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO artifact_versions (artifact_id, version, content, message, created_by)
  VALUES (NEW.id, 1, NEW.content, 'Initial version', NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_artifact_version AFTER INSERT ON artifacts
  FOR EACH ROW EXECUTE FUNCTION create_initial_artifact_version();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- MCP servers table is readable by all authenticated users (configurations are public)
CREATE POLICY "Authenticated users can read MCP servers" ON mcp_servers
  FOR SELECT TO authenticated USING (true);
