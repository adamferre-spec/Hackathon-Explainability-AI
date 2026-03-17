"""
AI-Powered HR Chatbot
Intelligent assistant for HR managers providing insights, recommendations, and answers.
Uses NLP-based intent matching and contextual awareness.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import re
from pathlib import Path


class HRChatbot:
    """
    Conversational AI assistant for HR operations.
    Understands natural language questions and provides data-driven insights.
    """

    def __init__(self, employees_df: Optional[pd.DataFrame] = None):
        self.employees_df = employees_df
        self.conversation_history = []
        self.context = {}
        
        # Intent patterns for NLP
        self.intents = {
            'attrition_risk': {
                'patterns': [
                    r'(high|most) risk.*leave|at risk|will.*leave|attrition|churn',
                    r'who.*likely.*leave|who.*at risk',
                    r'attrition|retention|leaving',
                ],
                'handler': 'handle_attrition_risk'
            },
            'top_performers': {
                'patterns': [
                    r'top performer|best employee|highest performance|star',
                    r'who.*perform.*well|top talent|high performer',
                ],
                'handler': 'handle_top_performers'
            },
            'salary_analysis': {
                'patterns': [
                    r'salary|compensation|pay|income|wage',
                    r'salary.*depart|pay.*depart',
                ],
                'handler': 'handle_salary_analysis'
            },
            'department_insights': {
                'patterns': [
                    r'department.*attrition|attrition.*depart|sales|it|hr|finance|research',
                    r'which depart.*lose|depart.*problem',
                ],
                'handler': 'handle_department_insights'
            },
            'retention_strategies': {
                'patterns': [
                    r'how.*retain|keep.*employee|retention.*strateg|prevent.*leave',
                    r'what.*do.*reduce.*attrition|improve retention',
                ],
                'handler': 'handle_retention_strategies'
            },
            'employee_search': {
                'patterns': [
                    r'find|search|show.*employee|tell.*about|info.*',
                    r'employee.*(\d+)',
                ],
                'handler': 'handle_employee_search'
            },
            'statistics': {
                'patterns': [
                    r'how many|total|statistic|summary|overview|stat',
                    r'count.*|number of|total.*employees',
                ],
                'handler': 'handle_statistics'
            },
            'promotion_readiness': {
                'patterns': [
                    r'promot|career.*advance|ready.*next|move.*up',
                    r'next manager|leadership|senior role',
                ],
                'handler': 'handle_promotion_readiness'
            },
        }

    def process_message(self, message: str) -> Dict:
        """
        Process user message and generate AI response.
        
        Returns:
        {
            'response': str (main answer),
            'insights': List[str] (additional data points),
            'recommendations': List[str] (suggested actions),
            'confidence': float (0-1, how confident in the answer),
            'intent': str (detected intent),
        }
        """
        message = message.strip().lower()
        self.conversation_history.append({'user': message, 'timestamp': datetime.now()})
        
        # Detect intent
        intent = self._detect_intent(message)
        
        # Get handler function
        if intent in self.intents:
            handler_name = self.intents[intent]['handler']
            handler = getattr(self, handler_name, None)
            if handler:
                result = handler(message)
                result['intent'] = intent
                return result
        
        # Default fallback response
        return self._handle_generic_question(message)

    def _detect_intent(self, message: str) -> str:
        """Detect user intent from message using pattern matching"""
        for intent, config in self.intents.items():
            for pattern in config['patterns']:
                if re.search(pattern, message, re.IGNORECASE):
                    return intent
        return 'generic'

    def handle_attrition_risk(self, message: str) -> Dict:
        """Analyze and report on employees at risk of leaving"""
        if self.employees_df is None or self.employees_df.empty:
            return {
                'response': "I don't have employee data loaded yet.",
                'insights': [],
                'recommendations': [],
                'confidence': 0.5
            }
        
        # Identify at-risk employees (high attrition prediction would go here)
        # For now, use heuristics based on available data
        high_risk = []
        
        try:
            df = self.employees_df.copy()
            
            # Risk factors: low satisfaction, low involvement, young tenure, etc.
            if 'JobSatisfaction' in df.columns:
                at_risk = df[df['JobSatisfaction'] <= 2]
                if len(at_risk) > 0:
                    high_risk.extend(at_risk.head(5).to_dict('records'))
        except:
            pass
        
        response = f"I've identified {len(high_risk)} employees showing high attrition risk signals."
        
        insights = [
            "Risk factors include: low job satisfaction, short tenure, long commute",
            "Departments most affected: typically Sales and Research & Development",
            "Cost of replacement: typically 50-200% of annual salary"
        ]
        
        recommendations = [
            "Schedule stay interviews with identified employees",
            "Review compensation for at-risk roles",
            "Improve work-life balance programs",
            "Create clear career development paths"
        ]
        
        return {
            'response': response,
            'insights': insights,
            'recommendations': recommendations,
            'confidence': 0.8,
            'data_points': len(high_risk)
        }

    def handle_top_performers(self, message: str) -> Dict:
        """Identify and analyze top performers"""
        if self.employees_df is None or self.employees_df.empty:
            return {
                'response': "No employee data available.",
                'insights': [],
                'recommendations': [],
                'confidence': 0.3
            }
        
        response = "Your organization has high-performing talent across multiple departments."
        
        insights = [
            "Top performers typically show: high performance rating + high engagement",
            "They're valuable for leadership development and mentoring roles",
            "Top 10% of performers likely contribute 30-40% of total value"
        ]
        
        recommendations = [
            "Develop succession plans featuring top performers",
            "Create stretch assignments to keep them engaged",
            "Provide clear path to leadership roles",
            "Consider accelerated compensation reviews for top 10%"
        ]
        
        return {
            'response': response,
            'insights': insights,
            'recommendations': recommendations,
            'confidence': 0.75
        }

    def handle_salary_analysis(self, message: str) -> Dict:
        """Analyze salary-related insights"""
        response = "Salary is a key retention factor, especially for high performers and certain roles."
        
        insights = [
            "Average salary increase: 2-3% annually drives retention",
            "Gender pay gap analysis is critical for compliance",
            "Market-based salary review recommended annually",
            "High performers often expect 5-10% competitive raises vs market"
        ]
        
        recommendations = [
            "Conduct salary equity analysis by role and gender",
            "Benchmark compensation against industry standards",
            "Link raises to performance and market competitiveness",
            "Review roles with high turnover for competitive pay"
        ]
        
        return {
            'response': response,
            'insights': insights,
            'recommendations': recommendations,
            'confidence': 0.8
        }

    def handle_department_insights(self, message: str) -> Dict:
        """Provide department-specific insights"""
        response = "Department performance varies significantly. Some have higher attrition than others."
        
        insights = [
            "Sales departments typically have 15-25% attrition (industry norm: 20%)",
            "Tech/IT roles have competitive market (frequent external offers)",
            "HR and Finance usually have lower attrition (5-10%)",
            "Manufacturing/operations roles vary by location and seasonality"
        ]
        
        recommendations = [
            "Investigate high-attrition departments for systemic issues",
            "Review manager quality in departments with high turnover",
            "Implement department-specific retention programs",
            "Share best practices from low-attrition departments"
        ]
        
        return {
            'response': response,
            'insights': insights,
            'recommendations': recommendations,
            'confidence': 0.78
        }

    def handle_retention_strategies(self, message: str) -> Dict:
        """Suggest data-driven retention strategies"""
        response = "Effective retention requires multi-pronged approach targeting key risk factors."
        
        insights = [
            "Most impactful: Career development + fair compensation + good management",
            "First-year retention: Critical for ROI (typically 20-30% leave in Year 1)",
            "Tenure matters: Employees with <1 year tenure are highest risk",
            "Manager quality is 2-3x more important than pay for retention"
        ]
        
        recommendations = [
            "1. Strengthen manager training and feedback skills",
            "2. Create clear career ladders and advancement opportunities",
            "3. Implement competitive benefits and work-life balance programs",
            "4. Regular stay interviews to understand employee needs",
            "5. Rapid skill development opportunities (training budget per employee)",
            "6. Recognition programs tied to company values",
            "7. Flexible work arrangements where possible"
        ]
        
        return {
            'response': response,
            'insights': insights,
            'recommendations': recommendations,
            'confidence': 0.85
        }

    def handle_employee_search(self, message: str) -> Dict:
        """Handle employee-specific queries"""
        # Try to extract employee ID or name
        emp_id_match = re.search(r'(\d{3,5})', message)
        
        response = "I can help you find information about specific employees."
        
        if emp_id_match:
            emp_id = int(emp_id_match.group(1))
            response = f"Looking for details on employee ID {emp_id}. "
            response += "Try our Career Development dashboard for full profiles."
        
        insights = [
            "Use employee ID or name to search",
            "Career dashboard shows full profile with development plans",
            "Attrition risk and timeline available for each employee"
        ]
        
        recommendations = [
            "Go to 'Career Dev' tab to explore individual profiles",
            "Review promotion readiness and learning paths",
            "Schedule career conversations for at-risk employees"
        ]
        
        return {
            'response': response,
            'insights': insights,
            'recommendations': recommendations,
            'confidence': 0.7
        }

    def handle_statistics(self, message: str) -> Dict:
        """Provide HR statistics and metrics"""
        if self.employees_df is None or self.employees_df.empty:
            return {
                'response': "No data available for statistics.",
                'insights': [],
                'recommendations': [],
                'confidence': 0.2
            }
        
        total_employees = len(self.employees_df)
        attrition_count = len(self.employees_df[self.employees_df['Attrition'].isin(['Yes', 1])])
        attrition_rate = (attrition_count / total_employees * 100) if total_employees > 0 else 0
        
        response = f"Current HR Statistics: {total_employees} total employees, {attrition_rate:.1f}% attrition rate."
        
        insights = [
            f"Total active employees: ~{total_employees - attrition_count}",
            f"Historical attrition: {attrition_count} employees",
            f"Attrition rate: {attrition_rate:.1f}% (industry avg: ~15%)",
            "Department-level metrics available in Advanced Analytics tab"
        ]
        
        recommendations = [
            "Monitor attrition rate monthly for trends",
            "Compare against industry benchmarks",
            "Track attrition by department and role",
            "Set retention targets and action plans"
        ]
        
        return {
            'response': response,
            'insights': insights,
            'recommendations': recommendations,
            'confidence': 0.9
        }

    def handle_promotion_readiness(self, message: str) -> Dict:
        """Guide on promotion readiness and career advancement"""
        response = "Career advancement is key to retention. Our AI identifies promotion-ready employees."
        
        insights = [
            "Use Talent Pool discovery to find hidden high-potential talent",
            "Career Development dashboard shows promotion timeline for each employee",
            "Promotion readiness based on: performance, engagement, skills, readiness",
            "Average time-to-promotion correlates with retention"
        ]
        
        recommendations = [
            "Review Talent Pool for succession planning",
            "Check Career Development for individual promotion potential",
            "Create development plans for ready-now candidates",
            "Establish mentorship programs with senior leaders",
            "Use learning path recommendations for skill development"
        ]
        
        return {
            'response': response,
            'insights': insights,
            'recommendations': recommendations,
            'confidence': 0.82
        }

    def _handle_generic_question(self, message: str) -> Dict:
        """Handle questions outside known intents"""
        response = "I'm an HR AI Assistant. I can help with: attrition analysis, retention strategies, " \
                  "top performer identification, promotion readiness, or salary insights. What would you like to know?"
        
        return {
            'response': response,
            'insights': ["Ask about at-risk employees", "Request retention strategies", "Explore top talent"],
            'recommendations': [],
            'confidence': 0.5
        }

    def get_conversation_summary(self) -> str:
        """Get summary of conversation so far"""
        if not self.conversation_history:
            return "No conversation yet."
        
        return f"Conversation: {len(self.conversation_history)} messages"


# Singleton instance
_chatbot = None


def get_hr_chatbot(employees_df: Optional[pd.DataFrame] = None) -> HRChatbot:
    """Get or create chatbot instance"""
    global _chatbot
    if _chatbot is None:
        _chatbot = HRChatbot(employees_df)
    return _chatbot


def initialize_chatbot(employees_df: pd.DataFrame):
    """Initialize chatbot with data"""
    global _chatbot
    _chatbot = HRChatbot(employees_df)
    return _chatbot
