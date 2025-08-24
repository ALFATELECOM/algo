import nodemailer from 'nodemailer';
import _ from 'lodash';

export interface NotificationConfig {
  email: {
    enabled: boolean;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    from: string;
  };
  push: {
    enabled: boolean;
    // Add push notification config here
  };
  sms: {
    enabled: boolean;
    // Add SMS config here
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate: string;
  variables: string[];
}

export interface NotificationRequest {
  type: 'EMAIL' | 'PUSH' | 'SMS' | 'IN_APP';
  recipient: string;
  templateId: string;
  variables: { [key: string]: any };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  scheduleAt?: Date;
  groupId?: string; // For batching similar notifications
}

export interface AlertRule {
  id: string;
  userId: string;
  name: string;
  type: 'PRICE_ALERT' | 'TECHNICAL_SIGNAL' | 'NEWS_ALERT' | 'PORTFOLIO_ALERT' | 'RISK_ALERT';
  conditions: {
    symbol?: string;
    priceAbove?: number;
    priceBelow?: number;
    changePercent?: number;
    indicator?: string;
    portfolioValue?: number;
    drawdown?: number;
    riskScore?: number;
  };
  actions: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    inApp?: boolean;
  };
  enabled: boolean;
  cooldown: number; // Minutes between notifications
  lastTriggered?: Date;
  createdAt: Date;
}

export interface NotificationHistory {
  id: string;
  userId: string;
  type: NotificationRequest['type'];
  templateId: string;
  recipient: string;
  subject: string;
  content: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  sentAt?: Date;
  errorMessage?: string;
  groupId?: string;
  createdAt: Date;
}

export class NotificationService {
  private config: NotificationConfig;
  private transporter: nodemailer.Transporter | null = null;
  private templates: Map<string, NotificationTemplate> = new Map();
  private alertRules: Map<string, AlertRule[]> = new Map(); // userId -> rules
  private notificationQueue: NotificationRequest[] = [];
  private isProcessing = false;

  constructor() {
    this.config = {
      email: {
        enabled: process.env.EMAIL_ENABLED === 'true',
        smtp: {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
          }
        },
        from: process.env.SMTP_FROM || 'noreply@aitrading.com'
      },
      push: {
        enabled: process.env.PUSH_ENABLED === 'true'
      },
      sms: {
        enabled: process.env.SMS_ENABLED === 'true'
      }
    };

    this.initializeTransporter();
    this.loadTemplates();
    this.startQueueProcessor();
  }

  private initializeTransporter() {
    if (this.config.email.enabled && this.config.email.smtp.auth.user) {
      try {
        this.transporter = nodemailer.createTransporter(this.config.email.smtp);
        console.log('📧 Email transporter initialized');
      } catch (error) {
        console.error('❌ Failed to initialize email transporter:', error);
      }
    }
  }

  private loadTemplates() {
    // Default templates
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'price_alert',
        name: 'Price Alert',
        subject: '🚨 Price Alert: {{symbol}} reached {{price}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Price Alert Triggered</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
              <h3>{{symbol}}</h3>
              <p><strong>Current Price:</strong> ₹{{currentPrice}}</p>
              <p><strong>Alert Price:</strong> ₹{{alertPrice}}</p>
              <p><strong>Change:</strong> {{change}} ({{changePercent}}%)</p>
              <p><strong>Time:</strong> {{timestamp}}</p>
            </div>
            <p style="color: #6b7280; margin-top: 20px;">
              This alert was triggered based on your configured price targets.
            </p>
          </div>
        `,
        textTemplate: `
Price Alert: {{symbol}} reached ₹{{currentPrice}}
Alert Price: ₹{{alertPrice}}
Change: {{change}} ({{changePercent}}%)
Time: {{timestamp}}
        `,
        variables: ['symbol', 'currentPrice', 'alertPrice', 'change', 'changePercent', 'timestamp']
      },
      {
        id: 'technical_signal',
        name: 'Technical Signal',
        subject: '📈 Technical Signal: {{signal}} for {{symbol}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Technical Signal Detected</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
              <h3>{{symbol}} - {{signal}} Signal</h3>
              <p><strong>Indicator:</strong> {{indicator}}</p>
              <p><strong>Signal Strength:</strong> {{strength}}%</p>
              <p><strong>Current Price:</strong> ₹{{currentPrice}}</p>
              <p><strong>Description:</strong> {{description}}</p>
              <p><strong>Time:</strong> {{timestamp}}</p>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
              <p style="margin: 0; color: #92400e;">
                <strong>⚠️ Disclaimer:</strong> This is an automated signal for informational purposes only. 
                Please conduct your own analysis before making trading decisions.
              </p>
            </div>
          </div>
        `,
        textTemplate: `
Technical Signal: {{signal}} for {{symbol}}
Indicator: {{indicator}}
Strength: {{strength}}%
Current Price: ₹{{currentPrice}}
Description: {{description}}
Time: {{timestamp}}

⚠️ This is for informational purposes only. Conduct your own analysis before trading.
        `,
        variables: ['symbol', 'signal', 'indicator', 'strength', 'currentPrice', 'description', 'timestamp']
      },
      {
        id: 'order_filled',
        name: 'Order Filled',
        subject: '✅ Order Filled: {{symbol}} {{side}} order',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Order Successfully Filled</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
              <h3>Order #{{orderId}}</h3>
              <p><strong>Symbol:</strong> {{symbol}}</p>
              <p><strong>Side:</strong> {{side}}</p>
              <p><strong>Quantity:</strong> {{quantity}}</p>
              <p><strong>Price:</strong> ₹{{price}}</p>
              <p><strong>Total Value:</strong> ₹{{totalValue}}</p>
              <p><strong>Filled At:</strong> {{timestamp}}</p>
            </div>
            <p style="color: #6b7280; margin-top: 20px;">
              Your order has been successfully executed. Check your portfolio for updated positions.
            </p>
          </div>
        `,
        textTemplate: `
Order Filled: {{symbol}} {{side}}
Order ID: {{orderId}}
Quantity: {{quantity}}
Price: ₹{{price}}
Total Value: ₹{{totalValue}}
Filled At: {{timestamp}}
        `,
        variables: ['orderId', 'symbol', 'side', 'quantity', 'price', 'totalValue', 'timestamp']
      },
      {
        id: 'risk_alert',
        name: 'Risk Alert',
        subject: '⚠️ Risk Alert: {{alertType}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Risk Alert</h2>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
              <h3>{{alertType}}</h3>
              <p><strong>Description:</strong> {{description}}</p>
              <p><strong>Current Value:</strong> {{currentValue}}</p>
              <p><strong>Threshold:</strong> {{threshold}}</p>
              <p><strong>Severity:</strong> {{severity}}</p>
              <p><strong>Time:</strong> {{timestamp}}</p>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
              <h4 style="margin-top: 0; color: #92400e;">Recommended Actions:</h4>
              <ul style="color: #92400e;">
                {{#each recommendations}}
                <li>{{this}}</li>
                {{/each}}
              </ul>
            </div>
          </div>
        `,
        textTemplate: `
Risk Alert: {{alertType}}
Description: {{description}}
Current Value: {{currentValue}}
Threshold: {{threshold}}
Severity: {{severity}}
Time: {{timestamp}}

Recommended Actions:
{{#each recommendations}}
- {{this}}
{{/each}}
        `,
        variables: ['alertType', 'description', 'currentValue', 'threshold', 'severity', 'timestamp', 'recommendations']
      },
      {
        id: 'daily_summary',
        name: 'Daily Portfolio Summary',
        subject: '📊 Daily Portfolio Summary - {{date}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Daily Portfolio Summary</h2>
            <p style="color: #6b7280;">{{date}}</p>
            
            <div style="display: flex; gap: 20px; margin: 20px 0;">
              <div style="flex: 1; background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
                <h4 style="margin: 0; color: #6b7280;">Portfolio Value</h4>
                <p style="font-size: 24px; font-weight: bold; margin: 5px 0; color: #1f2937;">₹{{totalValue}}</p>
              </div>
              <div style="flex: 1; background: {{pnlColor}}; padding: 15px; border-radius: 8px; text-align: center;">
                <h4 style="margin: 0; color: #fff;">Daily P&L</h4>
                <p style="font-size: 24px; font-weight: bold; margin: 5px 0; color: #fff;">₹{{dailyPnL}}</p>
              </div>
            </div>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
              <h3>Top Performers</h3>
              {{#each topGainers}}
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>{{symbol}}</span>
                <span style="color: #059669;">+{{changePercent}}%</span>
              </div>
              {{/each}}
              
              <h3 style="margin-top: 20px;">Top Losers</h3>
              {{#each topLosers}}
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>{{symbol}}</span>
                <span style="color: #dc2626;">{{changePercent}}%</span>
              </div>
              {{/each}}
            </div>
          </div>
        `,
        textTemplate: `
Daily Portfolio Summary - {{date}}

Portfolio Value: ₹{{totalValue}}
Daily P&L: ₹{{dailyPnL}}

Top Performers:
{{#each topGainers}}
{{symbol}}: +{{changePercent}}%
{{/each}}

Top Losers:
{{#each topLosers}}
{{symbol}}: {{changePercent}}%
{{/each}}
        `,
        variables: ['date', 'totalValue', 'dailyPnL', 'pnlColor', 'topGainers', 'topLosers']
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    console.log(`📧 Loaded ${defaultTemplates.length} notification templates`);
  }

  private startQueueProcessor() {
    setInterval(() => {
      if (!this.isProcessing && this.notificationQueue.length > 0) {
        this.processNotificationQueue();
      }
    }, 5000); // Process every 5 seconds

    console.log('🔄 Notification queue processor started');
  }

  private async processNotificationQueue() {
    if (this.isProcessing || this.notificationQueue.length === 0) return;

    this.isProcessing = true;
    const batch = this.notificationQueue.splice(0, 10); // Process 10 at a time

    try {
      await Promise.all(batch.map(notification => this.sendNotification(notification)));
    } catch (error) {
      console.error('❌ Error processing notification batch:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Public methods
  async sendNotification(request: NotificationRequest): Promise<boolean> {
    try {
      const template = this.templates.get(request.templateId);
      if (!template) {
        throw new Error(`Template ${request.templateId} not found`);
      }

      const renderedContent = this.renderTemplate(template, request.variables);

      switch (request.type) {
        case 'EMAIL':
          return await this.sendEmail(request.recipient, renderedContent.subject, renderedContent.html, renderedContent.text);
        case 'PUSH':
          return await this.sendPushNotification(request.recipient, renderedContent.subject, renderedContent.text);
        case 'SMS':
          return await this.sendSMS(request.recipient, renderedContent.text);
        case 'IN_APP':
          return await this.sendInAppNotification(request.recipient, renderedContent);
        default:
          throw new Error(`Unsupported notification type: ${request.type}`);
      }
    } catch (error) {
      console.error(`❌ Failed to send ${request.type} notification:`, error);
      return false;
    }
  }

  addToQueue(request: NotificationRequest) {
    if (request.scheduleAt && request.scheduleAt > new Date()) {
      // Schedule for later
      const delay = request.scheduleAt.getTime() - new Date().getTime();
      setTimeout(() => {
        this.notificationQueue.push(request);
      }, delay);
    } else {
      this.notificationQueue.push(request);
    }
  }

  // Alert rule management
  addAlertRule(userId: string, rule: Omit<AlertRule, 'id' | 'createdAt'>): string {
    const alertRule: AlertRule = {
      ...rule,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    if (!this.alertRules.has(userId)) {
      this.alertRules.set(userId, []);
    }

    this.alertRules.get(userId)!.push(alertRule);
    console.log(`🔔 Added alert rule for user ${userId}: ${rule.name}`);
    
    return alertRule.id;
  }

  removeAlertRule(userId: string, ruleId: string): boolean {
    const userRules = this.alertRules.get(userId);
    if (!userRules) return false;

    const index = userRules.findIndex(rule => rule.id === ruleId);
    if (index === -1) return false;

    userRules.splice(index, 1);
    console.log(`🗑️ Removed alert rule ${ruleId} for user ${userId}`);
    return true;
  }

  updateAlertRule(userId: string, ruleId: string, updates: Partial<AlertRule>): boolean {
    const userRules = this.alertRules.get(userId);
    if (!userRules) return false;

    const rule = userRules.find(r => r.id === ruleId);
    if (!rule) return false;

    Object.assign(rule, updates);
    console.log(`✏️ Updated alert rule ${ruleId} for user ${userId}`);
    return true;
  }

  getUserAlertRules(userId: string): AlertRule[] {
    return this.alertRules.get(userId) || [];
  }

  // Check alerts against market data
  checkAlerts(userId: string, marketData: any, portfolioData: any) {
    const userRules = this.alertRules.get(userId);
    if (!userRules) return;

    userRules
      .filter(rule => rule.enabled)
      .forEach(rule => {
        if (this.shouldTriggerAlert(rule, marketData, portfolioData)) {
          this.triggerAlert(userId, rule, marketData, portfolioData);
        }
      });
  }

  private shouldTriggerAlert(rule: AlertRule, marketData: any, portfolioData: any): boolean {
    // Check cooldown
    if (rule.lastTriggered) {
      const cooldownMs = rule.cooldown * 60 * 1000;
      if (new Date().getTime() - rule.lastTriggered.getTime() < cooldownMs) {
        return false;
      }
    }

    const { conditions } = rule;

    switch (rule.type) {
      case 'PRICE_ALERT':
        if (conditions.symbol && marketData[conditions.symbol]) {
          const price = marketData[conditions.symbol].price;
          return (conditions.priceAbove && price >= conditions.priceAbove) ||
                 (conditions.priceBelow && price <= conditions.priceBelow);
        }
        break;

      case 'PORTFOLIO_ALERT':
        if (conditions.portfolioValue && portfolioData.totalValue) {
          return portfolioData.totalValue <= conditions.portfolioValue;
        }
        if (conditions.drawdown && portfolioData.maxDrawdown) {
          return portfolioData.maxDrawdown >= conditions.drawdown;
        }
        break;

      case 'RISK_ALERT':
        if (conditions.riskScore && portfolioData.riskScore) {
          return portfolioData.riskScore >= conditions.riskScore;
        }
        break;
    }

    return false;
  }

  private triggerAlert(userId: string, rule: AlertRule, marketData: any, portfolioData: any) {
    console.log(`🚨 Triggering alert ${rule.id} for user ${userId}: ${rule.name}`);

    // Update last triggered time
    rule.lastTriggered = new Date();

    // Determine template and variables based on alert type
    let templateId: string;
    let variables: { [key: string]: any } = {};

    switch (rule.type) {
      case 'PRICE_ALERT':
        templateId = 'price_alert';
        if (rule.conditions.symbol && marketData[rule.conditions.symbol]) {
          const data = marketData[rule.conditions.symbol];
          variables = {
            symbol: rule.conditions.symbol,
            currentPrice: data.price.toFixed(2),
            alertPrice: (rule.conditions.priceAbove || rule.conditions.priceBelow)?.toFixed(2),
            change: data.change.toFixed(2),
            changePercent: data.changePercent.toFixed(2),
            timestamp: new Date().toLocaleString()
          };
        }
        break;

      case 'TECHNICAL_SIGNAL':
        templateId = 'technical_signal';
        variables = {
          symbol: rule.conditions.symbol || 'Unknown',
          signal: 'BUY', // This would come from the actual signal
          indicator: rule.conditions.indicator || 'Technical Indicator',
          strength: '85',
          currentPrice: '2500.00',
          description: 'Technical analysis indicates a strong buy signal',
          timestamp: new Date().toLocaleString()
        };
        break;

      case 'RISK_ALERT':
        templateId = 'risk_alert';
        variables = {
          alertType: 'Portfolio Risk Threshold Exceeded',
          description: 'Your portfolio risk score has exceeded the configured threshold',
          currentValue: portfolioData.riskScore?.toString() || 'N/A',
          threshold: rule.conditions.riskScore?.toString() || 'N/A',
          severity: 'HIGH',
          timestamp: new Date().toLocaleString(),
          recommendations: [
            'Review high-risk positions',
            'Consider reducing position sizes',
            'Increase portfolio diversification'
          ]
        };
        break;

      default:
        console.warn(`⚠️ Unknown alert type: ${rule.type}`);
        return;
    }

    // Send notifications based on rule actions
    if (rule.actions.email) {
      this.addToQueue({
        type: 'EMAIL',
        recipient: `user_${userId}@example.com`, // This would be the actual user email
        templateId,
        variables,
        priority: 'HIGH'
      });
    }

    if (rule.actions.inApp) {
      this.addToQueue({
        type: 'IN_APP',
        recipient: userId,
        templateId,
        variables,
        priority: 'HIGH'
      });
    }

    // Add push and SMS if enabled
    if (rule.actions.push) {
      this.addToQueue({
        type: 'PUSH',
        recipient: userId,
        templateId,
        variables,
        priority: 'HIGH'
      });
    }
  }

  // Template rendering
  private renderTemplate(template: NotificationTemplate, variables: { [key: string]: any }) {
    let subject = template.subject;
    let html = template.htmlTemplate;
    let text = template.textTemplate;

    // Simple template variable replacement
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, String(value));
      html = html.replace(regex, String(value));
      text = text.replace(regex, String(value));
    });

    // Handle arrays for #each blocks (simplified)
    Object.entries(variables).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        const eachRegex = new RegExp(`{{#each ${key}}}([\\s\\S]*?){{/each}}`, 'g');
        
        html = html.replace(eachRegex, (match, content) => {
          return value.map(item => {
            let itemContent = content;
            if (typeof item === 'object') {
              Object.entries(item).forEach(([itemKey, itemValue]) => {
                itemContent = itemContent.replace(new RegExp(`{{${itemKey}}}`, 'g'), String(itemValue));
              });
            } else {
              itemContent = itemContent.replace(/{{this}}/g, String(item));
            }
            return itemContent;
          }).join('');
        });

        text = text.replace(eachRegex, (match, content) => {
          return value.map(item => {
            let itemContent = content;
            if (typeof item === 'object') {
              Object.entries(item).forEach(([itemKey, itemValue]) => {
                itemContent = itemContent.replace(new RegExp(`{{${itemKey}}}`, 'g'), String(itemValue));
              });
            } else {
              itemContent = itemContent.replace(/{{this}}/g, String(item));
            }
            return itemContent;
          }).join('');
        });
      }
    });

    return { subject, html, text };
  }

  // Notification methods
  private async sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
    if (!this.transporter || !this.config.email.enabled) {
      console.log('📧 Email not configured, skipping email notification');
      return false;
    }

    try {
      const result = await this.transporter.sendMail({
        from: this.config.email.from,
        to,
        subject,
        html,
        text
      });

      console.log(`📧 Email sent successfully to ${to}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error);
      return false;
    }
  }

  private async sendPushNotification(userId: string, title: string, body: string): Promise<boolean> {
    if (!this.config.push.enabled) {
      console.log('📱 Push notifications not configured, skipping');
      return false;
    }

    // Mock implementation - integrate with FCM, APNs, etc.
    console.log(`📱 Push notification sent to ${userId}: ${title}`);
    return true;
  }

  private async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.config.sms.enabled) {
      console.log('📱 SMS not configured, skipping SMS notification');
      return false;
    }

    // Mock implementation - integrate with Twilio, AWS SNS, etc.
    console.log(`📱 SMS sent to ${phoneNumber}: ${message.substring(0, 50)}...`);
    return true;
  }

  private async sendInAppNotification(userId: string, content: any): Promise<boolean> {
    // This would integrate with WebSocket service
    console.log(`🔔 In-app notification sent to ${userId}: ${content.subject}`);
    return true;
  }

  // Bulk operations
  async sendDailySummary(userId: string, portfolioData: any) {
    const variables = {
      date: new Date().toLocaleDateString(),
      totalValue: portfolioData.totalValue.toLocaleString(),
      dailyPnL: portfolioData.dailyPnL.toFixed(2),
      pnlColor: portfolioData.dailyPnL >= 0 ? '#059669' : '#dc2626',
      topGainers: portfolioData.topGainers || [],
      topLosers: portfolioData.topLosers || []
    };

    this.addToQueue({
      type: 'EMAIL',
      recipient: `user_${userId}@example.com`,
      templateId: 'daily_summary',
      variables,
      priority: 'LOW'
    });
  }

  // Utility methods
  getQueueLength(): number {
    return this.notificationQueue.length;
  }

  getTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  addTemplate(template: NotificationTemplate) {
    this.templates.set(template.id, template);
    console.log(`📧 Added notification template: ${template.name}`);
  }

  removeTemplate(templateId: string): boolean {
    const deleted = this.templates.delete(templateId);
    if (deleted) {
      console.log(`🗑️ Removed notification template: ${templateId}`);
    }
    return deleted;
  }
}

export default new NotificationService();
