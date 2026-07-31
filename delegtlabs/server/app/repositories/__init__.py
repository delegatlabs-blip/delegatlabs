from app.repositories.agent_repository import AgentRepository, agent_repo
from app.repositories.customer_repository import CustomerRepository, customer_repo
from app.repositories.user_repository import UserRepository, user_repo

__all__ = [
    "AgentRepository",
    "agent_repo",
    "UserRepository",
    "user_repo",
    "CustomerRepository",
    "customer_repo",
]
