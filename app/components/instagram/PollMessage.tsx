import React from 'react';
import { BarChart3 } from 'lucide-react';

interface PollMessageProps {
  question: string;
  options: {
    id: string;
    text: string;
    votes: string[];
    percentage?: number;
  }[];
  multipleChoice?: boolean;
  anonymous?: boolean;
  currentUserId?: string;
  isIncoming: boolean;
  presentationScale?: number;
  theme: any;
}

export const PollMessage: React.FC<PollMessageProps> = ({
  question,
  options,
  multipleChoice = false,
  anonymous = false,
  currentUserId = 'me',
  isIncoming,
  presentationScale = 1,
  theme
}) => {
  const containerStyle: React.CSSProperties = {
    backgroundColor: isIncoming ? theme.bubbleColorIncoming : theme.bubbleColorOutgoing,
    borderRadius: `${18 * presentationScale}px`,
    padding: `${12 * presentationScale}px`,
    minWidth: `${260 * presentationScale}px`,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${8 * presentationScale}px`,
    marginBottom: `${12 * presentationScale}px`,
  };

  const iconStyle: React.CSSProperties = {
    width: `${20 * presentationScale}px`,
    height: `${20 * presentationScale}px`,
  };

  const questionStyle: React.CSSProperties = {
    fontSize: `${14 * presentationScale}px`,
    fontWeight: 600,
    color: isIncoming ? theme.textColorIncoming : theme.textColorOutgoing,
    flex: 1,
  };

  const optionStyle = (hasVoted: boolean): React.CSSProperties => ({
    marginBottom: `${8 * presentationScale}px`,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: `${8 * presentationScale}px`,
    border: `1px solid ${isIncoming ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)'}`,
  });

  const optionContentStyle: React.CSSProperties = {
    padding: `${8 * presentationScale}px ${12 * presentationScale}px`,
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const optionTextStyle: React.CSSProperties = {
    fontSize: `${13 * presentationScale}px`,
    color: isIncoming ? theme.textColorIncoming : theme.textColorOutgoing,
  };

  const percentageStyle: React.CSSProperties = {
    fontSize: `${12 * presentationScale}px`,
    fontWeight: 500,
    color: isIncoming ? theme.textColorIncoming : theme.textColorOutgoing,
  };

  const progressBarStyle = (percentage: number): React.CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${percentage}%`,
    backgroundColor: isIncoming ? 'rgba(228, 64, 95, 0.15)' : 'rgba(255, 255, 255, 0.15)',
    zIndex: 1,
    transition: 'width 0.3s ease',
  });

  const footerStyle: React.CSSProperties = {
    marginTop: `${8 * presentationScale}px`,
    fontSize: `${11 * presentationScale}px`,
    color: isIncoming ? theme.textColorIncoming : theme.textColorOutgoing,
    opacity: 0.7,
    textAlign: 'center',
  };

  // Calculate percentages
  const totalVotes = options.reduce((sum, opt) => sum + opt.votes.length, 0);
  const optionsWithPercentage = options.map(opt => ({
    ...opt,
    percentage: totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0
  }));

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <BarChart3 
          size={20 * presentationScale} 
          color={isIncoming ? theme.textColorIncoming : theme.textColorOutgoing}
        />
        <div style={questionStyle}>{question}</div>
      </div>
      
      {optionsWithPercentage.map((option) => {
        const hasVoted = option.votes.includes(currentUserId);
        return (
          <div key={option.id} style={optionStyle(hasVoted)}>
            <div style={progressBarStyle(option.percentage)} />
            <div style={optionContentStyle}>
              <span style={optionTextStyle}>
                {hasVoted && '✓ '}{option.text}
              </span>
              {totalVotes > 0 && (
                <span style={percentageStyle}>{option.percentage}%</span>
              )}
            </div>
          </div>
        );
      })}
      
      <div style={footerStyle}>
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        {multipleChoice && ' • Multiple choice'}
        {anonymous && ' • Anonymous'}
      </div>
    </div>
  );
};