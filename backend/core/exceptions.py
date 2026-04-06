"""커스텀 예외 클래스"""


class DocFlowError(Exception):
    """DocFlow 기본 예외"""

    def __init__(self, message: str, detail: str | None = None):
        self.message = message
        self.detail = detail
        super().__init__(message)


class DocumentGenerationError(DocFlowError):
    """문서 생성 실패"""

    def __init__(self, message: str, tool: str, detail: str | None = None):
        self.tool = tool
        super().__init__(message, detail)


class FileNotFoundError(DocFlowError):
    """파일 없음 또는 만료"""
    pass


class JobNotFoundError(DocFlowError):
    """작업 없음"""
    pass


class AgentError(DocFlowError):
    """Claude Agent 오류"""
    pass
