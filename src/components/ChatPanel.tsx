import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Group,
  Paper,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { Send } from "./icons";
import type { Message, WhatsAppSession } from "../domain/types";
import { statusColor } from "../ui/status";

interface ChatPanelProps {
  channelMode: string;
  composer: string;
  currentSession?: WhatsAppSession;
  messages: Message[];
  onChannelModeChange: (value: string) => void;
  onComposerChange: (value: string) => void;
  onSendMessage: () => void;
}

export function ChatPanel({
  channelMode,
  composer,
  currentSession,
  messages,
  onChannelModeChange,
  onComposerChange,
  onSendMessage,
}: ChatPanelProps) {
  return (
    <Paper className="chat-panel" radius="sm">
      {currentSession && (
        <>
          <Box className="chat-header">
            <Group>
              <Avatar color={statusColor[currentSession.status]} radius="xl">
                {currentSession.displayName.slice(0, 2).toUpperCase()}
              </Avatar>
              <Box>
                <Text fw={800}>{currentSession.displayName}</Text>
                <Text c="dimmed" size="xs">
                  {currentSession.phoneNumber}
                </Text>
              </Box>
            </Group>
            <Group gap="xs">
              <Badge color={statusColor[currentSession.status]} variant="light">
                {currentSession.status}
              </Badge>
              <SegmentedControl
                size="xs"
                value={channelMode}
                onChange={onChannelModeChange}
                data={[
                  { label: "Atendente", value: "human" },
                  { label: "Agente", value: "agent" },
                ]}
              />
            </Group>
          </Box>
          <ScrollArea className="message-list" type="auto">
            <Stack gap="sm">
              {messages.map((message) => (
                <Box className="message-row" data-direction={message.direction} key={message.id}>
                  <Box className="message-bubble" data-direction={message.direction}>
                    <Group gap="xs" justify="space-between">
                      <Text fw={700} size="xs">
                        {message.author}
                      </Text>
                      <Text c="dimmed" size="xs">
                        {message.sentAt}
                      </Text>
                    </Group>
                    <Text size="sm">{message.body}</Text>
                  </Box>
                </Box>
              ))}
            </Stack>
          </ScrollArea>
          <Box className="composer">
            <Textarea
              autosize
              minRows={1}
              maxRows={4}
              placeholder="Mensagem"
              value={composer}
              onChange={(event) => onComposerChange(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSendMessage();
                }
              }}
            />
            <Tooltip label="Enviar mensagem">
              <ActionIcon size="xl" radius="xl" color="green" onClick={onSendMessage} aria-label="Enviar">
                <Send size={19} />
              </ActionIcon>
            </Tooltip>
          </Box>
        </>
      )}
    </Paper>
  );
}
