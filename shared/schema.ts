import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const mcpConnections = pgTable("mcp_connections", {
  id: serial("id").primaryKey(),
  serverUrl: text("server_url").notNull(),
  isSecure: boolean("is_secure").default(false),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mcpMessages = pgTable("mcp_messages", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id").references(() => mcpConnections.id),
  messageType: text("message_type").notNull(), // 'request', 'response', 'error', 'notification'
  messageId: text("message_id"),
  method: text("method"),
  content: jsonb("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const mcpTools = pgTable("mcp_tools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  inputSchema: jsonb("input_schema"),
  isEnabled: boolean("is_enabled").default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMcpConnectionSchema = createInsertSchema(mcpConnections).pick({
  serverUrl: true,
  isSecure: true,
});

export const insertMcpMessageSchema = createInsertSchema(mcpMessages).pick({
  connectionId: true,
  messageType: true,
  messageId: true,
  method: true,
  content: true,
});

export const insertMcpToolSchema = createInsertSchema(mcpTools).pick({
  name: true,
  description: true,
  inputSchema: true,
  isEnabled: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMcpConnection = z.infer<typeof insertMcpConnectionSchema>;
export type McpConnection = typeof mcpConnections.$inferSelect;

export type InsertMcpMessage = z.infer<typeof insertMcpMessageSchema>;
export type McpMessage = typeof mcpMessages.$inferSelect;

export type InsertMcpTool = z.infer<typeof insertMcpToolSchema>;
export type McpTool = typeof mcpTools.$inferSelect;

// MCP Protocol Types
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

export interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: any;
}

export interface McpToolInterface {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface ToolCallResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}
