import { pgTable, serial, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// 1. Users Table
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable);
export const selectUserSchema = createSelectSchema(usersTable);
export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;

// 2. Case Studies Table
export const caseStudiesTable = pgTable("case_studies", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  sector: text("sector").notNull(),
  location: text("location").notNull(),
  challenge: text("challenge").notNull(),
  solution: text("solution").notNull(),
  technologyStack: text("technology_stack").notNull(),
  capacity: text("capacity").notNull(),
  results: text("results").notNull(),
  testimonial: text("testimonial"),
  tags: jsonb("tags").$type<string[]>(),
  fullText: text("full_text"),
  richData: jsonb("rich_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCaseStudySchema = createInsertSchema(caseStudiesTable);
export const selectCaseStudySchema = createSelectSchema(caseStudiesTable);
export type CaseStudy = typeof caseStudiesTable.$inferSelect;
export type InsertCaseStudy = typeof caseStudiesTable.$inferInsert;

// 3. Questionnaires Table
export const questionnairesTable = pgTable("questionnaires", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  sector: text("sector").notNull(),
  questions: jsonb("questions"),
  answers: jsonb("answers"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuestionnaireSchema = createInsertSchema(questionnairesTable);
export const selectQuestionnaireSchema = createSelectSchema(questionnairesTable);
export type Questionnaire = typeof questionnairesTable.$inferSelect;
export type InsertQuestionnaire = typeof questionnairesTable.$inferInsert;

// 4. Questionnaire Projects Table
export const questionnaireProjectsTable = pgTable("questionnaire_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person"),
  location: text("location"),
  date: text("date"),
  sector: text("sector"),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuestionnaireProjectSchema = createInsertSchema(questionnaireProjectsTable);
export const selectQuestionnaireProjectSchema = createSelectSchema(questionnaireProjectsTable);
export type QuestionnaireProject = typeof questionnaireProjectsTable.$inferSelect;
export type InsertQuestionnaireProject = typeof questionnaireProjectsTable.$inferInsert;

// 5. Assistant Documents Table
export const assistantDocumentsTable = pgTable("assistant_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssistantDocumentSchema = createInsertSchema(assistantDocumentsTable);
export const selectAssistantDocumentSchema = createSelectSchema(assistantDocumentsTable);
export type AssistantDocument = typeof assistantDocumentsTable.$inferSelect;
export type InsertAssistantDocument = typeof assistantDocumentsTable.$inferInsert;

// 6. Case Creator Projects Table
export const caseCreatorProjectsTable = pgTable("case_creator_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCaseCreatorProjectSchema = createInsertSchema(caseCreatorProjectsTable);
export const selectCaseCreatorProjectSchema = createSelectSchema(caseCreatorProjectsTable);
export type CaseCreatorProject = typeof caseCreatorProjectsTable.$inferSelect;
export type InsertCaseCreatorProject = typeof caseCreatorProjectsTable.$inferInsert;

// 7. Chats Table
export const chatsTable = pgTable("chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  firebaseUid: text("firebase_uid"),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatSchema = createInsertSchema(chatsTable);
export const selectChatSchema = createSelectSchema(chatsTable);
export type Chat = typeof chatsTable.$inferSelect;
export type InsertChat = typeof chatsTable.$inferInsert;