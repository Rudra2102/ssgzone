import React, { useState, useEffect } from 'react';
import mailService from '../services/mailService';

const SignatureManager = ({ onSignatureUpdate }) => {
  const [signature, setSignature] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTenantSignature();
  }, []);

  const fetchTenantSignature = async () => {
    try {
      const response = await mailService.getTenantSignature();
      if (response.signature) {
        setSignature(response.signature.html_signature || '');
        setIsMandatory(response.signature.is_mandatory || false);
        if (onSignatureUpdate) {
          onSignatureUpdate(response.signature);
        }
      }
    } catch (error) {
      console.error('Error fetching signature:', error);
    }
  };

  const applySignatureToEmail = (emailBody, isHtml = true) => {
    if (!signature || !isMandatory) {
      return emailBody;
    }

    if (isHtml) {
      return `${emailBody}<br><br>${signature}`;
    } else {
      // Convert HTML to plain text
      const plainSignature = signature.replace(/<[^>]*>/g, '');
      return `${emailBody}\n\n${plainSignature}`;
    }
  };

  return {
    signature,
    isMandatory,
    applySignatureToEmail
  };
};

export default SignatureManager;