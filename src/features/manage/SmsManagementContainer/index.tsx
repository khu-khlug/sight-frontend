import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Box, Dialog, Heading, Input, Text, Textarea } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/Button";
import BaseModal from "../../../components/BaseModal";
import Callout from "../../../components/Callout";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";
import PageNavigator from "../../../components/PageNavigator";
import { ManageUserApiDto, UserManageApi } from "../../../api/manage/user";
import { SmsManageApi, SmsMessageResult, SendSmsResponse } from "../../../api/manage/sms";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { useCurrentUser } from "../../../hooks/user/useCurrentUser";

import styles from "./style.module.css";

const LIMIT = 50;
const DEFAULT_MESSAGE = "[쿠러그]\n\n(발신 전용)\n\n";
const STEPS = ["회원 수신자", "직접 수신번호", "메시지 작성", "전송 내용 확인"];

type User = ManageUserApiDto["UserResponse"];

const byteLength = (value: string) =>
  Array.from(value).reduce((sum, character) => sum + (/[\x00-\x7F]/.test(character) ? 1 : 2), 0);

const normalizePhones = (value: string) =>
  value
    .split(",")
    .map((phone) => phone.replace(/\D/g, ""))
    .filter(Boolean);

function ResultTable({ results }: { results: SmsMessageResult[] }) {
  return (
    <table className={styles.results}>
      <thead>
        <tr><th>수신자</th><th>전화번호</th><th>유형</th><th>상태</th><th>사유</th></tr>
      </thead>
      <tbody>
        {results.map((result, index) => (
          <tr key={`${result.memberId ?? "direct"}-${result.phone ?? index}`}>
            <td>{result.memberId ? `회원 #${result.memberId}` : "직접 입력"}</td>
            <td>{result.phone ?? "-"}</td>
            <td>{result.type ?? "-"}</td>
            <td>{result.status === "SENT" ? "성공" : result.status === "FAILED" ? "실패" : "제외"}</td>
            <td>{result.message ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function SmsManagementContainer() {
  const navigate = useNavigate();
  const { data: currentUser, isLoading: isUserLoading, isError: isUserError } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchName, setSearchName] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [additionalPhones, setAdditionalPhones] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [result, setResult] = useState<SendSmsResponse | null>(null);
  const [isSenderPhoneModalOpen, setIsSenderPhoneModalOpen] = useState(false);
  const [senderPhoneInput, setSenderPhoneInput] = useState("");
  const [senderPhoneError, setSenderPhoneError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [showRecipientValidation, setShowRecipientValidation] = useState(false);
  const [showMessageValidation, setShowMessageValidation] = useState(false);

  useEffect(() => {
    if (!isUserLoading && (isUserError || !currentUser || !currentUser.manager)) navigate("/", { replace: true });
  }, [currentUser, isUserError, isUserLoading, navigate]);

  const usersQuery = useQuery({
    queryKey: ["sms-member-list", searchName, page],
    queryFn: () => UserManageApi.listUserForManager({
      name: searchName, number: null, college: null, email: null, phone: null,
      grade: null, studentStatus: null, tag: null, limit: LIMIT, offset: (page - 1) * LIMIT,
    }),
    enabled: !!currentUser,
    retry: 0,
  });

  const senderPhoneQuery = useQuery({
    queryKey: ["sender-phone"],
    queryFn: SmsManageApi.getSenderPhone,
    enabled: !!currentUser,
    retry: 0,
  });
  const senderPhoneMutation = useMutation({
    mutationFn: SmsManageApi.updateSenderPhone,
    onSuccess: () => {
      setSenderPhoneError(null);
      setIsSenderPhoneModalOpen(false);
      void senderPhoneQuery.refetch();
    },
    onError: (error) => setSenderPhoneError(extractErrorMessage(error)),
  });

  const smsMutation = useMutation({
    mutationFn: SmsManageApi.sendSms,
    onSuccess: (data) => setResult(data),
  });

  const selectedIds = useMemo(() => new Set(selectedUsers.map((user) => user.id)), [selectedUsers]);
  const directPhoneCount = normalizePhones(additionalPhones).length;
  const hasRecipients = selectedUsers.length > 0 || directPhoneCount > 0;
  const trimmedMessage = message.trim();
  const canSend = hasRecipients && trimmedMessage.length > 0 && !smsMutation.isPending;
  const bytes = byteLength(message);
  const displayedSenderPhone = senderPhoneQuery.data?.phone
    ? senderPhoneQuery.data.phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
    : senderPhoneQuery.isLoading ? "불러오는 중" : "등록되지 않음";

  if (isUserLoading) return <CenterRingLoadingIndicator />;
  if (!currentUser) return null;

  const toggleUser = (user: User) => {
    setShowRecipientValidation(false);
    setSelectedUsers((previous) => selectedIds.has(user.id)
      ? previous.filter((selected) => selected.id !== user.id)
      : [...previous, user]);
  };
  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearchName(searchInput.trim() || null);
  };
  const send = () => {
    if (!canSend) return;
    setResult(null);
    smsMutation.mutate({
      memberIds: selectedUsers.map((user) => user.id),
      additionalPhoneNumbers: additionalPhones.split(",").map((phone) => phone.trim()).filter(Boolean),
      message,
    });
  };
  const moveToMessageStep = () => {
    if (!hasRecipients) {
      setShowRecipientValidation(true);
      return;
    }
    setStep(3);
  };
  const moveToReviewStep = () => {
    if (!trimmedMessage) {
      setShowMessageValidation(true);
      return;
    }
    setStep(4);
  };

  return (
    <Box className={`${styles.container} ${styles.card}`}>
      <Heading size="xl">운영진 문자 발송</Heading>
      <Text color="gray.600">회원 또는 직접 입력한 수신자에게 문자를 발송합니다.</Text>
      <div className={styles.senderPhone}>
        <Text>공식 발신번호: {displayedSenderPhone}</Text>
        <button
          type="button"
          className={styles.textButton}
          onClick={() => {
            setSenderPhoneInput(senderPhoneQuery.data?.phone ?? "");
            setSenderPhoneError(null);
            setIsSenderPhoneModalOpen(true);
          }}
        >
          수정
        </button>
      </div>

      <hr className={styles.divider} />

      <ol className={styles.stepper} aria-label="문자 발송 단계">
        {STEPS.map((label, index) => (
          <li key={label} className={step === index + 1 ? styles.currentStep : step > index + 1 ? styles.completedStep : undefined} aria-current={step === index + 1 ? "step" : undefined}>
            <span>{index + 1}</span>{label}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className={styles.section}>
          <Heading size="md">회원 수신자 ({selectedUsers.length}명)</Heading>
          <form className={styles.inlineForm} onSubmit={submitSearch}>
            <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="이름 검색" aria-label="회원 이름 검색" />
            <Button type="submit" variant="dark-outline">검색</Button>
          </form>
          {usersQuery.isError && <Callout type="error">{extractErrorMessage(usersQuery.error)}</Callout>}
          {usersQuery.isLoading && <CenterRingLoadingIndicator />}
          {usersQuery.data && (
            <>
              <div className={styles.memberList}>
                {usersQuery.data.users.map((user) => (
                  <label className={styles.member} key={user.id}>
                    <input type="checkbox" checked={selectedIds.has(user.id)} onChange={() => toggleUser(user)} />
                    <span>{user.profile.name} · {user.profile.college || "소속 미등록"} · {user.admission} · {user.profile.phone ?? "전화번호 없음"}</span>
                  </label>
                ))}
                {usersQuery.data.users.length === 0 && <Callout type="info">검색 결과가 없습니다.</Callout>}
              </div>
              <PageNavigator currentPage={page} countPerPage={LIMIT} totalCount={usersQuery.data.count} onPageChange={setPage} />
            </>
          )}
          <Box className={styles.actions}>
            <Button onClick={() => setStep(2)}>다음</Button>
          </Box>
        </div>
      )}

      {step === 2 && (
        <div className={styles.section}>
          <Heading size="md">직접 입력 수신번호</Heading>
          <Textarea value={additionalPhones} onChange={(event) => { setAdditionalPhones(event.target.value); setShowRecipientValidation(false); }} placeholder="쉼표로 여러 번호를 입력하세요" aria-label="직접 입력 수신번호" />
          <Text color="gray.600">정규화 후 {directPhoneCount}개 번호가 발송 대상입니다.</Text>
          {showRecipientValidation && <Callout type="error">회원 또는 직접 입력 수신자를 지정하세요.</Callout>}
          <Box className={styles.actions}>
            <Button variant="neutral" onClick={() => setStep(1)}>이전</Button>
            <Button onClick={moveToMessageStep}>다음</Button>
          </Box>
        </div>
      )}

      {step === 3 && (
        <div className={styles.section}>
          <Heading size="md">메시지</Heading>
          {directPhoneCount > 0 && <Callout type="info">직접 입력한 수신자에게는 {`{realname}`} 위치에 정규화된 전화번호가 표시됩니다.</Callout>}
          <Textarea value={message} onChange={(event) => { setMessage(event.target.value); setShowMessageValidation(false); }} rows={8} aria-label="문자 메시지" />
          <Text>{bytes}바이트 · {bytes <= 90 ? "SMS" : "LMS"} 자동 전환 (90바이트 기준)</Text>
          {showMessageValidation && <Callout type="error">메시지를 입력하세요.</Callout>}
          <Box className={styles.actions}>
            <Button variant="neutral" onClick={() => setStep(2)}>이전</Button>
            <Button onClick={moveToReviewStep}>다음</Button>
          </Box>
        </div>
      )}

      {step === 4 && !result && (
        <div className={styles.section}>
          <Heading size="md">발송 내용 확인</Heading>
          <Text>공식 발신번호: {displayedSenderPhone}</Text>
          <div className={styles.recipientSummary}>
            <Heading size="sm">회원 수신자 ({selectedUsers.length}명)</Heading>
            {selectedUsers.length > 0 ? selectedUsers.map((user) => <Text key={user.id}>{user.profile.name} · {user.profile.phone ?? "전화번호 없음"}</Text>) : <Text color="gray.600">선택한 회원이 없습니다.</Text>}
          </div>
          <div className={styles.recipientSummary}>
            <Heading size="sm">직접 입력 수신번호 ({directPhoneCount}개)</Heading>
            {directPhoneCount > 0 ? normalizePhones(additionalPhones).map((phone) => <Text key={phone}>{phone}</Text>) : <Text color="gray.600">직접 입력한 번호가 없습니다.</Text>}
          </div>
          <Box className={styles.messagePreview}>{message}</Box>
          {smsMutation.isError && <Callout type="error">{extractErrorMessage(smsMutation.error)}</Callout>}
          <Box className={styles.actions}>
            <Button variant="neutral" disabled={smsMutation.isPending} onClick={() => setStep(3)}>이전</Button>
            <Button disabled={!canSend} onClick={send}>{smsMutation.isPending ? "발송 중..." : "문자 발송"}</Button>
          </Box>
        </div>
      )}

      {step === 4 && result && (
        <div className={styles.section}>
          <Heading size="md">발송 결과</Heading>
          <Callout type={result.results.every((item) => item.status === "SENT") ? "success" : "info"}>
            {result.results.every((item) => item.status === "SENT") ? "모든 수신자에게 정상 접수되었습니다." : "일부 수신자의 발송 결과를 확인하세요."}
          </Callout>
          <ResultTable results={result.results} />
          {result.results.some((item) => item.status !== "SENT") && (
            <Button
              variant="neutral"
              onClick={() => {
                const failed = result.results.filter((item) => item.status !== "SENT");
                setSelectedUsers((users) => users.filter((user) => failed.some((item) => item.memberId === user.id)));
                setAdditionalPhones(failed.filter((item) => item.memberId === null && item.phone).map((item) => item.phone).join(","));
                setResult(null);
                setStep(1);
              }}
            >
              실패·제외 수신자만 다시 작성
            </Button>
          )}
          <Button variant="neutral" onClick={() => { setResult(null); setSelectedUsers([]); setAdditionalPhones(""); setMessage(DEFAULT_MESSAGE); setStep(1); }}>새 작성</Button>
        </div>
      )}

      <BaseModal
        isOpen={isSenderPhoneModalOpen}
        onRequestClose={() => setIsSenderPhoneModalOpen(false)}
      >
        <Dialog.Header p={0} mb="20px">
          <Dialog.Title fontSize="lg" fontWeight="semibold">공식 발신번호 수정</Dialog.Title>
        </Dialog.Header>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            senderPhoneMutation.mutate(senderPhoneInput);
          }}
        >
          <Dialog.Body p={0}>
            <Input
              value={senderPhoneInput}
              onChange={(event) => setSenderPhoneInput(event.target.value)}
              placeholder="010-0000-0000"
              aria-label="공식 발신번호"
            />
            {senderPhoneError && <Callout type="error">{senderPhoneError}</Callout>}
          </Dialog.Body>
          <Dialog.Footer p={0} mt="22px" className={styles.modalActions}>
            <Button type="button" variant="neutral" onClick={() => setIsSenderPhoneModalOpen(false)}>취소</Button>
            <Button type="submit" disabled={senderPhoneMutation.isPending || !senderPhoneInput.trim()}>
              {senderPhoneMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </Dialog.Footer>
        </form>
      </BaseModal>
    </Box>
  );
}
