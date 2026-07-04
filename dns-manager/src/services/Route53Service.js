const AWS = require('aws-sdk');

class Route53Service {
  constructor() {
    this.route53 = new AWS.Route53({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  async createRecords(domain, records) {
    const hostedZoneId = await this.getHostedZoneId(domain);
    const changes = records.map(record => ({
      Action: 'CREATE',
      ResourceRecordSet: {
        Name: record.name,
        Type: record.type,
        TTL: record.ttl || 3600,
        ResourceRecords: [{ Value: record.value }]
      }
    }));

    const params = {
      HostedZoneId: hostedZoneId,
      ChangeBatch: { Changes: changes }
    };

    const result = await this.route53.changeResourceRecordSets(params).promise();
    return result.ChangeInfo;
  }

  async getHostedZoneId(domain) {
    const params = { DNSName: domain };
    const result = await this.route53.listHostedZonesByName(params).promise();
    
    const zone = result.HostedZones.find(z => z.Name === `${domain}.`);
    if (!zone) {
      throw new Error(`Hosted zone not found for domain: ${domain}`);
    }

    return zone.Id.replace('/hostedzone/', '');
  }
}

module.exports = Route53Service;